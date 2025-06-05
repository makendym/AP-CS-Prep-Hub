import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Create a Supabase client with the service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] Received webhook request`);

  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      console.error(`[${requestId}] No Stripe signature found in request headers`);
      return NextResponse.json(
        { error: "No signature" },
        { status: 400 }
      );
    }

    console.log(`[${requestId}] Processing webhook with signature:`, signature);

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
      console.log(`[${requestId}] Successfully verified webhook signature for event:`, event.type);
    } catch (err: any) {
      console.error(`[${requestId}] Webhook signature verification failed:`, {
        error: err.message,
        eventType: event?.type,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${err.message}` },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case "customer.created": {
        const customer = event.data.object as Stripe.Customer;
        console.log(`[${requestId}] Processing customer.created:`, {
          customerId: customer.id,
          email: customer.email,
          metadata: customer.metadata
        });
        break;
      }

      case "customer.updated": {
        const customer = event.data.object as Stripe.Customer;
        console.log(`[${requestId}] Processing customer.updated:`, {
          customerId: customer.id,
          email: customer.email,
          changes: event.data.previous_attributes
        });
        break;
      }

      case "customer.deleted": {
        const customer = event.data.object as Stripe.Customer;
        console.log(`[${requestId}] Processing customer.deleted:`, {
          customerId: customer.id,
          email: customer.email,
          timestamp: new Date().toISOString()
        });
        break;
      }

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log(`[${requestId}] Processing checkout.session.completed:`, {
          sessionId: session.id,
          customerId: session.customer,
          subscriptionId: session.subscription,
          metadata: session.metadata
        });

        const userId = session.metadata?.user_id;
        if (!userId) {
          console.error(`[${requestId}] No user ID found in session metadata:`, session.metadata);
          return NextResponse.json(
            { error: "No user ID found in session metadata" },
            { status: 400 }
          );
        }

        try {
          // Verify user exists
          const { data: user, error: userError } = await supabase
            .from("profiles")
            .select("id")
            .eq("id", userId)
            .single();

          if (userError || !user) {
            console.error(`[${requestId}] User not found:`, {
              error: userError,
              userId,
              timestamp: new Date().toISOString()
            });
            return NextResponse.json(
              { error: "User not found" },
              { status: 404 }
            );
          }

          // Get the subscription details
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string) as unknown as {
            id: string;
            status: string;
            customer: string;
            items: { data: { price: { id: string } }[] };
            current_period_end: number;
          };
          console.log(`[${requestId}] Retrieved subscription details:`, {
            subscriptionId: subscription.id,
            status: subscription.status,
            customerId: subscription.customer,
            priceId: subscription.items.data[0].price.id,
            currentPeriodEnd: subscription.current_period_end
          });

          // Determine plan type
          const planType = subscription.items.data[0].price.id === process.env.NEXT_PUBLIC_STRIPE_STUDENT_YEARLY_PRICE_ID
            ? "student_yearly"
            : "student";

          // Get current subscription state
          const { data: currentSubscription, error: subscriptionError } = await supabase
            .from("subscriptions")
            .select("*")
            .eq("user_id", userId)
            .single();

          if (subscriptionError && subscriptionError.code !== 'PGRST116') {
            console.error(`[${requestId}] Error fetching current subscription:`, {
              error: subscriptionError,
              userId,
              timestamp: new Date().toISOString()
            });
            throw subscriptionError;
          }

          // Check if this is a downgrade attempt
          if (currentSubscription?.plan_type === 'student_yearly' && planType === 'student') {
            const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
            const now = new Date();
            
            if (currentPeriodEnd > now) {
              console.log(`[${requestId}] Downgrade attempt before period end:`, {
                subscriptionId: subscription.id,
                currentPeriodEnd: currentPeriodEnd.toISOString(),
                now: now.toISOString()
              });
              
              await stripe.subscriptions.cancel(subscription.id);
              
              return NextResponse.json(
                { 
                  error: "Downgrades are only allowed at the end of the billing period",
                  downgrade_available_at: currentPeriodEnd.toISOString()
                },
                { status: 403 }
              );
            }
          }

          // Ensure current_period_end is a valid timestamp
          const currentPeriodEnd = subscription.current_period_end 
            ? new Date(subscription.current_period_end * 1000)
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default to 30 days if not provided

          if (isNaN(currentPeriodEnd.getTime())) {
            console.error(`[${requestId}] Invalid current_period_end timestamp:`, {
              raw: subscription.current_period_end,
              parsed: currentPeriodEnd,
              timestamp: new Date().toISOString()
            });
            throw new Error("Invalid subscription period end date");
          }

          // Update subscription in database
          const { data: subscriptionData, error: updateError } = await supabase
            .from("subscriptions")
            .upsert({
              user_id: userId,
              status: subscription.status,
              plan_type: planType,
              stripe_subscription_id: subscription.id,
              stripe_customer_id: subscription.customer,
              current_period_end: currentPeriodEnd.toISOString(),
              can_downgrade: planType === 'student',
              downgrade_available_at: planType === 'student_yearly' 
                ? currentPeriodEnd.toISOString()
                : null,
              updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' })
            .select()
            .single();

          if (updateError) {
            console.error(`[${requestId}] Error updating subscription:`, {
              error: updateError,
              userId,
              subscriptionId: subscription.id,
              timestamp: new Date().toISOString()
            });
            throw updateError;
          }

          // Update profile
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .update({
              subscription_status: subscription.status,
              subscription_plan: planType,
              updated_at: new Date().toISOString()
            })
            .eq("id", userId)
            .select()
            .single();

          if (profileError) {
            console.error(`[${requestId}] Error updating profile:`, {
              error: profileError,
              userId,
              timestamp: new Date().toISOString()
            });
            throw profileError;
          }

          console.log(`[${requestId}] Successfully processed subscription update:`, {
            subscription: subscriptionData,
            profile: profileData,
            timestamp: new Date().toISOString()
          });

          return NextResponse.json({ received: true });
        } catch (err) {
          console.error(`[${requestId}] Error processing subscription:`, {
            error: err,
            userId,
            sessionId: session.id,
            timestamp: new Date().toISOString()
          });
          return NextResponse.json(
            { error: "Error processing subscription" },
            { status: 500 }
          );
        }
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription & {
          current_period_end: number;
        };
        console.log(`[${requestId}] Processing subscription.updated:`, {
          subscriptionId: subscription.id,
          customerId: subscription.customer,
          status: subscription.status,
          previousAttributes: event.data.previous_attributes,
          metadata: subscription.metadata
        });

        try {
          // Get the user ID from either subscription metadata or customer metadata
          let userId: string | undefined;
          
          // First check subscription metadata
          if (subscription.metadata?.user_id) {
            userId = subscription.metadata.user_id;
            console.log(`[${requestId}] Found user ID in subscription metadata:`, userId);
          } else {
            // Fall back to customer metadata
            const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;
            userId = customer.metadata.user_id;
            console.log(`[${requestId}] Found user ID in customer metadata:`, userId);
          }

          if (!userId) {
            console.error(`[${requestId}] No user ID found in either subscription or customer metadata:`, {
              subscriptionMetadata: subscription.metadata,
              customerId: subscription.customer
            });
            return NextResponse.json(
              { error: "No user ID found in subscription or customer metadata" },
              { status: 400 }
            );
          }

          // Get current subscription state to check if this is a transition from trial
          const { data: currentSubscription, error: currentSubscriptionError } = await supabase
            .from("subscriptions")
            .select("*")
            .eq("user_id", userId)
            .single();

          if (currentSubscriptionError && currentSubscriptionError.code !== 'PGRST116') {
            console.error(`[${requestId}] Error fetching current subscription:`, {
              error: currentSubscriptionError,
              userId,
              timestamp: new Date().toISOString()
            });
            throw currentSubscriptionError;
          }

          const isTransitionFromTrial = currentSubscription?.plan_type === 'trial';

          // Determine plan type based on the price ID
          const priceId = subscription.items.data[0].price.id;
          const planType = priceId === process.env.NEXT_PUBLIC_STRIPE_STUDENT_YEARLY_PRICE_ID
            ? "student_yearly"
            : "student";

          // Ensure current_period_end is a valid timestamp
          const currentPeriodEnd = subscription.current_period_end 
            ? new Date(subscription.current_period_end * 1000)
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

          if (isNaN(currentPeriodEnd.getTime())) {
            console.error(`[${requestId}] Invalid current_period_end timestamp:`, {
              raw: subscription.current_period_end,
              parsed: currentPeriodEnd,
              timestamp: new Date().toISOString()
            });
            throw new Error("Invalid subscription period end date");
          }

          // Update subscription in database
          const { data: subscriptionData, error: updateError } = await supabase
            .from("subscriptions")
            .upsert({
              user_id: userId,
              status: subscription.status,
              plan_type: planType,
              stripe_subscription_id: subscription.id,
              stripe_customer_id: subscription.customer,
              current_period_end: currentPeriodEnd.toISOString(),
              // If transitioning from trial, set trial_ended_at to now
              trial_ended_at: isTransitionFromTrial ? new Date().toISOString() : currentSubscription?.trial_ended_at,
              // Keep trial_started_at from previous subscription if it exists
              trial_started_at: currentSubscription?.trial_started_at,
              // Set downgrade fields based on plan type
              can_downgrade: planType === 'student',
              downgrade_available_at: planType === 'student_yearly' 
                ? currentPeriodEnd.toISOString()
                : null,
              updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' })
            .select()
            .single();

          if (updateError) {
            console.error(`[${requestId}] Error updating subscription:`, {
              error: updateError,
              userId,
              subscriptionId: subscription.id,
              timestamp: new Date().toISOString()
            });
            throw updateError;
          }

          // Update profile
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .update({
              subscription_status: subscription.status,
              subscription_plan: planType,
              // If transitioning from trial, update trial history
              trial_history: isTransitionFromTrial 
                ? JSON.stringify([
                    ...(currentSubscription?.trial_history ? JSON.parse(currentSubscription.trial_history) : []),
                    {
                      started_at: currentSubscription?.trial_started_at,
                      ended_at: new Date().toISOString(),
                      status: 'completed'
                    }
                  ])
                : currentSubscription?.trial_history,
              updated_at: new Date().toISOString()
            })
            .eq("id", userId)
            .select()
            .single();

          if (profileError) {
            console.error(`[${requestId}] Error updating profile:`, {
              error: profileError,
              userId,
              timestamp: new Date().toISOString()
            });
            throw profileError;
          }

          console.log(`[${requestId}] Successfully processed subscription update:`, {
            subscription: subscriptionData,
            profile: profileData,
            isTransitionFromTrial,
            timestamp: new Date().toISOString()
          });

          return NextResponse.json({ received: true });
        } catch (err) {
          console.error(`[${requestId}] Error processing subscription update:`, {
            error: err,
            subscriptionId: subscription.id,
            timestamp: new Date().toISOString()
          });
          return NextResponse.json(
            { error: "Error processing subscription update" },
            { status: 500 }
          );
        }
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`[${requestId}] Processing subscription.deleted:`, {
          subscriptionId: subscription.id,
          customerId: subscription.customer,
          status: subscription.status,
          timestamp: new Date().toISOString()
        });

        try {
          // Get the user ID from either subscription metadata or customer metadata
          let userId: string | undefined;
          
          // First check subscription metadata
          if (subscription.metadata?.user_id) {
            userId = subscription.metadata.user_id;
            console.log(`[${requestId}] Found user ID in subscription metadata:`, userId);
          } else {
            // Fall back to customer metadata
            const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;
            userId = customer.metadata.user_id;
            console.log(`[${requestId}] Found user ID in customer metadata:`, userId);
          }

          if (!userId) {
            console.error(`[${requestId}] No user ID found in either subscription or customer metadata:`, {
              subscriptionMetadata: subscription.metadata,
              customerId: subscription.customer
            });
            return NextResponse.json(
              { error: "No user ID found in subscription or customer metadata" },
              { status: 400 }
            );
          }

          // Delete the subscription from our database
          const { error: deleteError } = await supabase
            .from("subscriptions")
            .delete()
            .eq("stripe_subscription_id", subscription.id);

          if (deleteError) {
            console.error(`[${requestId}] Error deleting subscription:`, {
              error: deleteError,
              subscriptionId: subscription.id,
              timestamp: new Date().toISOString()
            });
            throw deleteError;
          }

          // Update profile to reflect the subscription status
          const { error: profileError } = await supabase
            .from("profiles")
            .update({
              subscription_status: "inactive",
              subscription_plan: "free",
              updated_at: new Date().toISOString()
            })
            .eq("id", userId);

          if (profileError) {
            console.error(`[${requestId}] Error updating profile:`, {
              error: profileError,
              userId,
              timestamp: new Date().toISOString()
            });
            throw profileError;
          }

          console.log(`[${requestId}] Successfully processed subscription deletion:`, {
            subscriptionId: subscription.id,
            timestamp: new Date().toISOString()
          });

          return NextResponse.json({ received: true });
        } catch (err) {
          console.error(`[${requestId}] Error processing subscription deletion:`, {
            error: err,
            subscriptionId: subscription.id,
            timestamp: new Date().toISOString()
          });
          return NextResponse.json(
            { error: "Error processing subscription deletion" },
            { status: 500 }
          );
        }
      }

      default:
        console.log(`[${requestId}] Unhandled event type:`, event.type);
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error(`[${requestId}] Unhandled webhook error:`, {
      error: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString()
    });
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
} 