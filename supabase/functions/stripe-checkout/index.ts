import { createClient } from 'npm:@supabase/supabase-js@2'
import Stripe from 'npm:stripe@13.11.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface CheckoutRequest {
  priceId: string
  couponCode?: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Check for required environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables')
      throw new Error('Server configuration error')
    }

    if (!stripeSecretKey) {
      console.error('Missing STRIPE_SECRET_KEY environment variable')
      throw new Error('Stripe configuration error')
    }

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    // Get the user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      console.error('User authentication error:', userError)
      throw new Error('Unauthorized')
    }

    // Parse request body
    const { priceId, couponCode }: CheckoutRequest = await req.json()

    if (!priceId) {
      throw new Error('Price ID is required')
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    })

    // Get or create Stripe customer
    let customerId: string
    
    // Check if customer already exists
    const { data: existingCustomer, error: customerError } = await supabaseClient
      .from('stripe_customers')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    if (customerError && customerError.code !== 'PGRST116') {
      console.error('Database error when fetching customer:', customerError)
      throw new Error('Database error')
    }

    if (existingCustomer) {
      customerId = existingCustomer.stripe_customer_id
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      })

      customerId = customer.id

      // Save customer to database
      const { error: insertError } = await supabaseClient
        .from('stripe_customers')
        .insert({
          user_id: user.id,
          stripe_customer_id: customerId,
          email: user.email,
        })

      if (insertError) {
        console.error('Error saving customer to database:', insertError)
        // Continue anyway, as the Stripe customer was created successfully
      }
    }

    // Prepare checkout session parameters
    const sessionParams: any = {
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.get('origin')}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/dashboard`,
      metadata: {
        user_id: user.id,
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
        },
      },
    }

    // Add coupon if provided
    if (couponCode) {
      // Validate coupon code
      const { data: coupon, error: couponError } = await supabaseClient
        .from('coupon_codes')
        .select('*')
        .eq('code', couponCode.toUpperCase())
        .eq('is_active', true)
        .single()

      if (couponError && couponError.code !== 'PGRST116') {
        console.error('Database error when fetching coupon:', couponError)
        throw new Error('Database error')
      }

      if (coupon) {
        // Check if coupon is still valid
        if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
          throw new Error('Coupon code has expired')
        }

        if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
          throw new Error('Coupon code usage limit reached')
        }

        // Create Stripe coupon if it doesn't exist
        let stripeCouponId = couponCode.toUpperCase()
        
        try {
          await stripe.coupons.retrieve(stripeCouponId)
        } catch (error) {
          // Create the coupon in Stripe
          await stripe.coupons.create({
            id: stripeCouponId,
            percent_off: coupon.discount_type === 'percentage' ? coupon.discount_value : undefined,
            amount_off: coupon.discount_type === 'amount' ? coupon.discount_value * 100 : undefined, // Stripe uses cents
            currency: coupon.discount_type === 'amount' ? 'usd' : undefined,
            duration: 'forever',
          })
        }

        sessionParams.discounts = [
          {
            coupon: stripeCouponId,
          },
        ]

        // Update coupon usage count
        const { error: updateError } = await supabaseClient
          .from('coupon_codes')
          .update({ used_count: coupon.used_count + 1 })
          .eq('code', couponCode.toUpperCase())

        if (updateError) {
          console.error('Error updating coupon usage:', updateError)
          // Continue anyway, as this is not critical for the checkout
        }
      }
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create(sessionParams)

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})