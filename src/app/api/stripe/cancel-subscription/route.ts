import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil",
});

// Create a Supabase client with the service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Add type for subscription with current_period_end
type SubscriptionWithPeriodEnd = Stripe.Subscription & {
  current_period_end: number;
};

export async function POST(req: Request) {
  try {
    const { subscriptionId } = await req.json();

    if (!subscriptionId) {
      return NextResponse.json(
        { error: "Subscription ID is required" },
        { status: 400 }
      );
    }

    try {
      // First, retrieve the subscription to check its status and type
      const subscriptionResponse = await stripe.subscriptions.retrieve(subscriptionId);
      const subscription = subscriptionResponse as unknown as SubscriptionWithPeriodEnd;
      
      // Get the subscription details from our database
      const { data: dbSubscription, error: dbError } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("stripe_subscription_id", subscriptionId)
        .single();

      if (dbError) {
        console.error("Error fetching subscription from database:", dbError);
        return NextResponse.json(
          { error: "Failed to fetch subscription details" },
          { status: 500 }
        );
      }

      // If the subscription is already incomplete_expired, just update our database
      if (subscription.status === 'incomplete_expired') {
        console.log('Subscription is incomplete_expired, updating database only');
        const { error: updateError } = await supabase
          .from("subscriptions")
          .update({
            status: "incomplete_expired",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscriptionId);

        if (updateError) {
          console.error("Error updating subscription status:", updateError);
          return NextResponse.json(
            { error: "Failed to update subscription status" },
            { status: 500 }
          );
        }

        return NextResponse.json({ 
          success: true,
          message: "Subscription was already expired and has been updated in our system."
        });
      }

      // For active subscriptions, handle based on plan type
      if (subscription.status === 'active' || subscription.status === 'trialing') {
        const isYearlyPlan = dbSubscription.plan_type === 'student_yearly';
        
        if (isYearlyPlan) {
          // For yearly plans, cancel at period end
          await stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: true
          });

          // Update the subscription in our database
          const { error: updateError } = await supabase
            .from("subscriptions")
            .update({
              status: "active",
              cancel_at_period_end: true,
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", subscriptionId);

          if (updateError) {
            console.error("Error updating subscription:", updateError);
            // Don't return error to user since Stripe update was successful
          }

          const periodEnd = new Date(subscription.current_period_end * 1000);
          const formattedDate = periodEnd.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });

          return NextResponse.json({ 
            success: true,
            message: `Your subscription has been scheduled for cancellation. Your access will continue until ${formattedDate}.`
          });
        } else {
          // For monthly plans, cancel immediately
          await stripe.subscriptions.cancel(subscriptionId);

          // Update the subscription in our database
          const { error: updateError } = await supabase
            .from("subscriptions")
            .update({
              status: "canceled",
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", subscriptionId);

          if (updateError) {
            console.error("Error updating subscription:", updateError);
            // Don't return error to user since Stripe cancellation was successful
          }

          return NextResponse.json({ 
            success: true,
            message: "Your subscription has been canceled. Your access will end immediately."
          });
        }
      }

      // For any other status, just update our database
      const { error: updateError } = await supabase
        .from("subscriptions")
        .update({
          status: subscription.status,
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_subscription_id", subscriptionId);

      if (updateError) {
        console.error("Error updating subscription status:", updateError);
        return NextResponse.json(
          { error: "Failed to update subscription status" },
          { status: 500 }
        );
      }

      return NextResponse.json({ 
        success: true,
        message: `Subscription status has been updated to ${subscription.status}.`
      });

    } catch (stripeError: any) {
      // If the subscription doesn't exist in Stripe, update our database to reflect this
      if (stripeError.code === 'resource_missing') {
        console.log('Subscription not found in Stripe, updating database to reflect this');
        const { error: updateError } = await supabase
          .from("subscriptions")
          .update({
            status: "inactive",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscriptionId);

        if (updateError) {
          console.error("Error updating subscription status:", updateError);
          return NextResponse.json(
            { error: "Failed to update subscription status" },
            { status: 500 }
          );
        }

        return NextResponse.json({ 
          success: true,
          message: "Subscription was not found in our payment system and has been marked as inactive."
        });
      }

      throw stripeError;
    }
  } catch (error) {
    console.error("Error canceling subscription:", error);
    return NextResponse.json(
      { error: "Failed to cancel subscription" },
      { status: 500 }
    );
  }
} 