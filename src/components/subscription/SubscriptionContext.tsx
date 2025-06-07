"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthContext";
import { supabase } from "@/lib/supabase";

export type SubscriptionStatus = "active" | "canceled" | "past_due" | "trialing" | "incomplete" | "incomplete_expired" | "inactive" | null;
export type PlanType = "free" | "trial" | "student" | "student_yearly" | "classroom" | null;

export interface Subscription {
  id: string;
  user_id: string;
  plan_type: PlanType;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: SubscriptionStatus;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
  trial_started_at: string | null;
  trial_ended_at: string | null;
  can_downgrade: boolean;
  downgrade_available_at: string | null;
  cancel_at_period_end: boolean;
}

type SubscriptionContextType = {
  subscription: Subscription | null;
  isLoading: boolean;
  refreshSubscription: () => Promise<void>;
  fetchSubscription: () => Promise<void>;
  forceRefreshSubscription: () => Promise<void>;
  isInTrialPeriod: boolean;
  hasPremiumAccess: boolean;
};

export const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const { user } = useAuth();

  const isInTrialPeriod = Boolean(
    subscription?.plan_type === "trial" && 
    subscription?.status === "active" && 
    subscription?.current_period_end && 
    new Date(subscription.current_period_end) > new Date()
  );

  const hasPremiumAccess = Boolean(
    subscription?.status === "active" && 
    (subscription?.plan_type === "student" || 
     subscription?.plan_type === "student_yearly" ||
     subscription?.plan_type === "classroom" || 
     isInTrialPeriod)
  );

  // Add real-time subscription updates
  useEffect(() => {
    if (!user) {
      setSubscription(null);
      setIsLoading(false);
      return;
    }

    // Set up real-time subscription for the user
    const subscriptionChannel = supabase
      .channel(`subscription-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          await fetchSubscription();
        }
      )
      .subscribe();

    // Set up real-time profile updates
    const profileChannel = supabase
      .channel(`profile-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        async (payload) => {
          await fetchSubscription();
        }
      )
      .subscribe();

    // Initial fetch
    fetchSubscription();

    return () => {
      subscriptionChannel.unsubscribe();
      profileChannel.unsubscribe();
    };
  }, [user]);

  const fetchSubscription = async () => {
    if (!user) {
      setSubscription(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // First check if a subscription exists
      const { data: existingSubscription, error: checkError } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (checkError) {
        console.error("Error checking subscription:", checkError);
        setSubscription(null);
        setIsLoading(false);
        return;
      }

      if (!existingSubscription) {
        // Create a new subscription with free plan
        const { data: newSubscription, error: createError } = await supabase
          .from("subscriptions")
          .insert({
            user_id: user.id,
            plan_type: "free",
            status: "inactive",
            current_period_end: null,
            can_downgrade: false,
            cancel_at_period_end: false
          })
          .select()
          .single();

        if (createError) {
          console.error("Error creating subscription:", createError);
          setSubscription(null);
          setIsLoading(false);
          return;
        }

        setSubscription(newSubscription as Subscription);
        setIsLoading(false);
        return;
      }

      // Fetch the full subscription data
      const { data, error } = await supabase
        .from("subscriptions")
        .select(`
          id,
          user_id,
          plan_type,
          stripe_customer_id,
          stripe_subscription_id,
          status,
          current_period_end,
          created_at,
          updated_at,
          trial_started_at,
          trial_ended_at,
          can_downgrade,
          downgrade_available_at,
          cancel_at_period_end
        `)
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error("Error fetching subscription:", error);
        setSubscription(null);
      } else {
        setSubscription(data as Subscription);
      }
    } catch (error) {
      console.error("Error in fetchSubscription:", error);
      setSubscription(null);
    } finally {
      setIsLoading(false);
    }
  };

  const forceRefreshSubscription = async () => {
    setIsFetching(true);
    try {
      await fetchSubscription();
    } finally {
      setIsFetching(false);
    }
  };

  const refreshSubscription = async () => {
    if (!isFetching) {
      await forceRefreshSubscription();
    }
  };

  const value = {
    subscription,
    isLoading,
    refreshSubscription,
    fetchSubscription,
    forceRefreshSubscription,
    isInTrialPeriod,
    hasPremiumAccess,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return context;
} 