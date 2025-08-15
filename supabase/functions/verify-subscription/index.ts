import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface VerifyRequest {
  sessionId: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('VITE_SUPABASE_URL') ?? '',
      Deno.env.get('VITE_SUPABASE_ANON_KEY') ?? '',
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
      throw new Error('Unauthorized')
    }

    // Parse request body
    const { sessionId }: VerifyRequest = await req.json()

    if (!sessionId) {
      throw new Error('Session ID is required')
    }

    // Initialize Stripe
    const stripe = new (await import('https://esm.sh/stripe@13.11.0')).default(
      Deno.env.get('STRIPE_SECRET_KEY') ?? '',
      {
        apiVersion: '2023-10-16',
      }
    )

    console.log(`Retrieving checkout session: ${sessionId}`);

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer'],
    })

    console.log(`Session retrieved: ${JSON.stringify(session, null, 2)}`);

    if (session.payment_status !== 'paid') {
      throw new Error('Payment not completed')
    }

    if (!session.subscription) {
      throw new Error('No subscription found')
    }

    const subscription = session.subscription as any
    console.log(`Subscription: ${JSON.stringify(subscription, null, 2)}`);

    // Determine plan type based on price
    let planType = 'monthly'
    if (subscription.items?.data?.[0]?.price?.recurring?.interval === 'year') {
      planType = 'yearly'
    }

    // Get or create stripe customer record
    const { data: existingCustomer } = await supabaseClient
      .from('stripe_customers')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!existingCustomer) {
      // Create new stripe customer record
      await supabaseClient
        .from('stripe_customers')
        .insert({
          user_id: user.id,
          stripe_customer_id: session.customer as string,
          email: user.email,
        })
    }

    console.log(`Updating user subscription for user ${user.id} with plan ${planType}`);

    // Update user subscription in database
    const { error: updateError } = await supabaseClient
      .from('user_subscriptions')
      .upsert({
        user_id: user.id,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: subscription.id,
        plan_type: planType,
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        updated_at: new Date().toISOString(),
      })

    if (updateError) {
      console.error(`Error updating subscription: ${JSON.stringify(updateError)}`);
      throw new Error(`Failed to update subscription: ${updateError.message}`);
    }

    console.log(`Subscription updated successfully`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        planType,
        status: subscription.status 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error verifying subscription:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})