import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil",
});

// Create a Supabase client with the anon key for session validation
const supabaseAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Create a Supabase client with the service role key for database operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] Received checkout creation request`);

  try {
    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error(`[${requestId}] No valid authorization header found`);
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Extract the token
    const token = authHeader.split(' ')[1];
    
    // Verify the session using the token directly
    const { data: { user }, error: userError } = await supabaseAnon.auth.getUser(token);
    if (userError || !user) {
      console.error(`[${requestId}] Invalid session:`, {
        error: userError,
        hasUser: !!user,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { priceId } = await req.json();

    if (!priceId) {
      console.error(`[${requestId}] No price ID provided in request`);
      return NextResponse.json(
        { error: "Price ID is required" },
        { status: 400 }
      );
    }

    const userId = user.id;
    const userEmail = user.email;

    if (!userEmail) {
      console.error(`[${requestId}] No email found for user:`, userId);
      return NextResponse.json(
        { error: "User email is required" },
        { status: 400 }
      );
    }

    console.log(`[${requestId}] Processing checkout for user:`, {
      userId,
      email: userEmail,
      priceId
    });

    // Get existing subscription with trial and downgrade information using admin client
    const { data: existingSubscription, error: subscriptionError } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (subscriptionError && subscriptionError.code !== 'PGRST116') {
      console.error(`[${requestId}] Error fetching subscription:`, {
        error: subscriptionError,
        userId,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json(
        { error: "Failed to fetch subscription" },
        { status: 500 }
      );
    }

    // Determine target plan type
    const targetPlanType = priceId === process.env.NEXT_PUBLIC_STRIPE_STUDENT_YEARLY_PRICE_ID 
      ? 'student_yearly' 
      : 'student';

    console.log(`[${requestId}] Target plan type:`, {
      targetPlanType,
      currentPlanType: existingSubscription?.plan_type,
      priceId
    });

    // Check if this is a downgrade attempt
    if (existingSubscription?.plan_type === 'student_yearly' && targetPlanType === 'student') {
      // Check if downgrade is allowed
      if (!existingSubscription.can_downgrade) {
        const downgradeDate = new Date(existingSubscription.downgrade_available_at);
        console.log(`[${requestId}] Downgrade attempt rejected:`, {
          userId,
          currentPlan: existingSubscription.plan_type,
          targetPlan: targetPlanType,
          downgradeAvailableAt: downgradeDate.toISOString()
        });
        return NextResponse.json(
          { 
            error: "You can only downgrade at the end of your billing period",
            downgrade_available_at: downgradeDate.toISOString()
          },
          { status: 403 }
        );
      }
    }

    // Check if an existing active/trialing subscription is found
    if (existingSubscription?.stripe_subscription_id && (existingSubscription.status === 'active' || existingSubscription.status === 'trialing')) {
      console.log(`[${requestId}] Found existing subscription, attempting update:`, {
        subscriptionId: existingSubscription.stripe_subscription_id,
        status: existingSubscription.status,
        planType: existingSubscription.plan_type
      });

      try {
        // For upgrades (monthly to yearly), allow immediate change
        // For downgrades (yearly to monthly), only allow at period end
        const isUpgrade = existingSubscription.plan_type === 'student' && targetPlanType === 'student_yearly';
        const isDowngrade = existingSubscription.plan_type === 'student_yearly' && targetPlanType === 'student';

        console.log(`[${requestId}] Subscription change type:`, {
          isUpgrade,
          isDowngrade,
          currentPlan: existingSubscription.plan_type,
          targetPlan: targetPlanType
        });

        if (isDowngrade && !existingSubscription.can_downgrade) {
          const downgradeDate = new Date(existingSubscription.downgrade_available_at);
          console.log(`[${requestId}] Downgrade attempt rejected:`, {
            subscriptionId: existingSubscription.stripe_subscription_id,
            downgradeAvailableAt: downgradeDate.toISOString()
          });
          return NextResponse.json(
            { 
              error: "You can only downgrade at the end of your billing period",
              downgrade_available_at: downgradeDate.toISOString()
            },
            { status: 403 }
          );
        }

        // Update the existing subscription in Stripe
        const updatedStripeSubscription = await stripe.subscriptions.update(
          existingSubscription.stripe_subscription_id,
          {
            items: [{
              id: (await stripe.subscriptions.retrieve(existingSubscription.stripe_subscription_id)).items.data[0].id,
              price: priceId,
            }],
            proration_behavior: isUpgrade ? 'create_prorations' : 'none',
            metadata: {
              user_id: userId
            }
          }
        );

        console.log(`[${requestId}] Successfully updated subscription:`, {
          subscriptionId: updatedStripeSubscription.id,
          status: updatedStripeSubscription.status,
          priceId,
          metadata: updatedStripeSubscription.metadata,
          timestamp: new Date().toISOString()
        });

        return NextResponse.json({
          url: `${process.env.NEXT_PUBLIC_BASE_URL}/success?subscription_updated=true&subscription_id=${updatedStripeSubscription.id}`
        });
      } catch (error: any) {
        console.error(`[${requestId}] Error updating subscription:`, {
          error: error.message,
          subscriptionId: existingSubscription.stripe_subscription_id,
          priceId,
          timestamp: new Date().toISOString()
        });
        return NextResponse.json(
          { error: "Failed to update subscription" },
          { status: 500 }
        );
      }
    }

    // Create new subscription for new customers
    console.log(`[${requestId}] Creating new checkout session for user:`, {
      userId,
      email: userEmail,
      priceId
    });
    
    // First, try to find an existing customer by email
    let customerId: string | undefined = undefined;
    if (existingSubscription?.stripe_customer_id) {
      // If we have a customer ID in our database, use that
      const existingCustomerId = existingSubscription.stripe_customer_id;
      try {
        // Verify the customer still exists in Stripe and update metadata if needed
        const customer = await stripe.customers.retrieve(existingCustomerId) as Stripe.Customer;
        if (!customer.deleted) {
          customerId = existingCustomerId;
          // Update customer metadata if user_id is not set
          if (!customer.metadata.user_id) {
            await stripe.customers.update(existingCustomerId, {
              metadata: { user_id: userId }
            });
            console.log(`[${requestId}] Updated customer metadata with user ID:`, {
              customerId,
              userId
            });
          }
          console.log(`[${requestId}] Found existing customer in database:`, {
            customerId,
            email: customer.email,
            metadata: customer.metadata
          });
        } else {
          console.log(`[${requestId}] Customer was deleted in Stripe:`, {
            customerId: existingCustomerId
          });
        }
      } catch (error: any) {
        console.log(`[${requestId}] Existing customer not found in Stripe:`, {
          customerId: existingCustomerId,
          error: error.message
        });
      }
    } else {
      // Search for customer by email
      const customers = await stripe.customers.list({
        email: userEmail,
        limit: 1
      });
      
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        // Update customer metadata if user_id is not set
        if (!customers.data[0].metadata.user_id) {
          await stripe.customers.update(customerId, {
            metadata: { user_id: userId }
          });
          console.log(`[${requestId}] Updated customer metadata with user ID:`, {
            customerId,
            userId
          });
        }
        console.log(`[${requestId}] Found existing customer by email:`, {
          customerId,
          email: userEmail,
          metadata: customers.data[0].metadata
        });
      }
    }

    // Create new subscription checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        user_id: userId,
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/pricing`,
      customer_email: customerId ? undefined : userEmail, // Only set email if no customer exists
      customer: customerId, // Use existing customer if found
      billing_address_collection: 'required',
      allow_promotion_codes: true,
      // Add customer metadata through subscription_data instead
      subscription_data: {
        metadata: {
          user_id: userId
        }
      }
    } as Stripe.Checkout.SessionCreateParams);

    if (!checkoutSession.url) {
      console.error(`[${requestId}] Failed to create checkout session URL`);
      throw new Error('Failed to create checkout session URL');
    }

    console.log(`[${requestId}] Successfully created checkout session:`, {
      sessionId: checkoutSession.id,
      customerId: customerId || 'new customer will be created',
      url: checkoutSession.url,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: any) {
    console.error(`[${requestId}] Unhandled error in create-checkout:`, {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
} 