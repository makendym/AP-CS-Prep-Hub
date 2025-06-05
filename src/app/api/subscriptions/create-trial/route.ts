import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Create a Supabase client with the service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Check if user has already used their trial
    const { data: profile, error: trialCheckError } = await supabase
      .from("profiles")
      .select("trial_used, trial_used_at")
      .eq("id", userId)
      .single();

    if (trialCheckError) {
      console.error("Error checking trial status:", trialCheckError);
      return NextResponse.json(
        { error: "Failed to check trial status" },
        { status: 500 }
      );
    }

    if (profile?.trial_used) {
      return NextResponse.json(
        { 
          error: "You have already used your trial period",
          trial_used_at: profile.trial_used_at
        },
        { status: 403 }
      );
    }

    // Calculate trial end date (14 days from now)
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 14);

    // First check if a subscription exists
    const { data: existingSubscription, error: checkError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error("Error checking existing subscription:", checkError);
      return NextResponse.json(
        { error: "Failed to check existing subscription" },
        { status: 500 }
      );
    }

    let subscription;
    let error;

    // If subscription exists, update it
    if (existingSubscription) {
      const { data: updatedSubscription, error: updateError } = await supabase
        .from("subscriptions")
        .update({
          plan_type: 'trial',
          status: 'active',
          current_period_end: trialEndDate.toISOString(),
          stripe_customer_id: null,
          stripe_subscription_id: null,
        })
        .eq("user_id", userId)
        .select()
        .single();

      subscription = updatedSubscription;
      error = updateError;
    } else {
      // If no subscription exists, create a new one
      const { data: newSubscription, error: createError } = await supabase
        .from("subscriptions")
        .insert({
          user_id: userId,
          plan_type: 'trial',
          status: 'active',
          current_period_end: trialEndDate.toISOString(),
          stripe_customer_id: null,
          stripe_subscription_id: null,
        })
        .select()
        .single();

      subscription = newSubscription;
      error = createError;
    }

    if (error) {
      console.error("Error managing trial subscription:", error);
      return NextResponse.json(
        { error: "Failed to manage trial subscription" },
        { status: 500 }
      );
    }

    // Update user's profile
    const { error: profileUpdateError } = await supabase
      .from("profiles")
      .update({
        subscription_status: "active",
        subscription_plan: "trial",
        trial_used: true,
        trial_used_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (profileUpdateError) {
      console.error("Error updating profile:", profileUpdateError);
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, subscription });
  } catch (error) {
    console.error("Error in create-trial:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 