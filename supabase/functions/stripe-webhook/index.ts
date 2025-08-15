import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "npm:@supabase/supabase-js@2"
import Stripe from "npm:stripe@13.11.0"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get environment variables
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY")
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")
    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

    if (!stripeSecretKey || !webhookSecret || !supabaseUrl || !supabaseServiceKey) {
      console.error("Missing required environment variables")
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      )
    }

    // Get the raw body and signature
    const body = await req.text()
    const signature = req.headers.get("stripe-signature")

    if (!signature) {
      console.error("Missing Stripe signature")
      return new Response(
        JSON.stringify({ error: "Missing Stripe signature" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      )
    }

    console.log(`Received webhook with signature: ${signature.substring(0, 20)}...`)

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    })

    // Verify the webhook signature
    let event
    try {
      // event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);

      console.log("✅ Webhook signature verified successfully")
    } catch (err) {
      console.error(`❌ Webhook signature verification failed: ${err.message}`)
      return new Response(
        JSON.stringify({ error: "Webhook signature verification failed" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      )
    }

    console.log(`Processing webhook event: ${event.type} (ID: ${event.id})`)

    // Initialize Supabase client with service role key for admin access
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object
        console.log(`Processing checkout.session.completed for: ${session.customer_email}`)

        if (!session.customer_email) {
          console.error("No customer email in session")
          return new Response(
            JSON.stringify({ error: "No customer email in session" }),
            { 
              status: 400, 
              headers: { ...corsHeaders, "Content-Type": "application/json" } 
            }
          )
        }

        // Determine plan type from the price ID or metadata
        let planType = "monthly" // Default to monthly
        
        // If metadata has plan info, use that
        if (session.metadata && session.metadata.plan) {
          planType = session.metadata.plan
          console.log(`Plan type from metadata: ${planType}`)
        } else if (session.line_items) {
          // Try to determine from line items if available
          console.log("Checking line items for plan type")
        }

        // Get subscription details if available
        let subscriptionData = {}
        if (session.subscription) {
          try {
            const subscription = await stripe.subscriptions.retrieve(session.subscription)
            
            // Determine plan type from subscription interval if not already set
            if (planType === "monthly" && subscription.items.data[0]?.plan?.interval === "year") {
              planType = "yearly"
              console.log(`Plan type determined from subscription interval: ${planType}`)
            }
            
            subscriptionData = {
              stripe_subscription_id: subscription.id,
              status: subscription.status,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              cancel_at_period_end: subscription.cancel_at_period_end,
            }
            console.log("✅ Retrieved subscription data successfully")
          } catch (err) {
            console.error(`Error retrieving subscription: ${err.message}`)
          }
        }

        // Find user by email
        const { data: userData, error: userError } = await supabase.auth.admin.listUsers()
        
        if (userError) {
          console.error(`Error fetching users: ${userError.message}`)
          return new Response(
            JSON.stringify({ error: "Error fetching users" }),
            { 
              status: 500, 
              headers: { ...corsHeaders, "Content-Type": "application/json" } 
            }
          )
        }

        const user = userData.users.find(u => u.email === session.customer_email)
        
        if (!user) {
          console.error(`User not found with email: ${session.customer_email}`)
          return new Response(
            JSON.stringify({ error: "User not found" }),
            { 
              status: 404, 
              headers: { ...corsHeaders, "Content-Type": "application/json" } 
            }
          )
        }

        console.log(`✅ Found user: ${user.id} (${user.email})`)

        // Update or create stripe customer record
        if (session.customer) {
          const { error: customerError } = await supabase
            .from("stripe_customers")
            .upsert({
              user_id: user.id,
              stripe_customer_id: session.customer,
              email: session.customer_email,
            })

          if (customerError) {
            console.error(`Error upserting stripe customer: ${customerError.message}`)
          } else {
            console.log("✅ Stripe customer record updated")
          }
        }

        // Update user subscription
        const subscriptionUpdate = {
          user_id: user.id,
          stripe_customer_id: session.customer,
          plan_type: planType,
          updated_at: new Date().toISOString(),
          ...subscriptionData
        }

        const { error: subscriptionError } = await supabase
          .from("user_subscriptions")
          .upsert(subscriptionUpdate)

        if (subscriptionError) {
          console.error(`Error updating user subscription: ${subscriptionError.message}`)
          return new Response(
            JSON.stringify({ error: "Error updating subscription" }),
            { 
              status: 500, 
              headers: { ...corsHeaders, "Content-Type": "application/json" } 
            }
          )
        }

        console.log(`✅ Successfully updated subscription for user: ${user.email} to plan: ${planType}`)
        break
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object
        console.log(`Processing customer.subscription.updated for subscription: ${subscription.id}`)

        // Find user by stripe customer ID
        const { data: customerData, error: customerError } = await supabase
          .from("stripe_customers")
          .select("user_id")
          .eq("stripe_customer_id", subscription.customer)
          .single()

        if (customerError || !customerData) {
          console.error(`Customer not found for subscription update: ${subscription.customer}`)
          return new Response(
            JSON.stringify({ error: "Customer not found" }),
            { 
              status: 404, 
              headers: { ...corsHeaders, "Content-Type": "application/json" } 
            }
          )
        }

        // Determine plan type from subscription interval
        let planType = "monthly" // Default
        if (subscription.items.data[0]?.plan?.interval === "year") {
          planType = "yearly"
        }
        console.log(`Plan type determined from subscription: ${planType}`)

        // Update subscription status
        const { error: updateError } = await supabase
          .from("user_subscriptions")
          .update({
            plan_type: planType,
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", customerData.user_id)

        if (updateError) {
          console.error(`Error updating subscription status: ${updateError.message}`)
          return new Response(
            JSON.stringify({ error: "Error updating subscription status" }),
            { 
              status: 500, 
              headers: { ...corsHeaders, "Content-Type": "application/json" } 
            }
          )
        }

        console.log(`✅ Successfully updated subscription status for user: ${customerData.user_id}`)
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object
        console.log(`Processing customer.subscription.deleted for subscription: ${subscription.id}`)

        // Find user by stripe customer ID
        const { data: customerData, error: customerError } = await supabase
          .from("stripe_customers")
          .select("user_id")
          .eq("stripe_customer_id", subscription.customer)
          .single()

        if (customerError || !customerData) {
          console.error(`Customer not found for subscription deletion: ${subscription.customer}`)
          return new Response(
            JSON.stringify({ error: "Customer not found" }),
            { 
              status: 404, 
              headers: { ...corsHeaders, "Content-Type": "application/json" } 
            }
          )
        }

        // Reset to free plan
        const { error: updateError } = await supabase
          .from("user_subscriptions")
          .update({
            plan_type: "free",
            status: "canceled",
            stripe_subscription_id: null,
            current_period_start: null,
            current_period_end: null,
            cancel_at_period_end: false,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", customerData.user_id)

        if (updateError) {
          console.error(`Error resetting subscription to free: ${updateError.message}`)
          return new Response(
            JSON.stringify({ error: "Error resetting subscription" }),
            { 
              status: 500, 
              headers: { ...corsHeaders, "Content-Type": "application/json" } 
            }
          )
        }

        console.log(`✅ Successfully reset subscription to free for user: ${customerData.user_id}`)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(
      JSON.stringify({ received: true, event_type: event.type }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    )

  } catch (error) {
    console.error(`Webhook processing error: ${error.message}`)
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    )
  }
})