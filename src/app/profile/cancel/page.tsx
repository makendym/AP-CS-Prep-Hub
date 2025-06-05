"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthContext";
import { useSubscription, SubscriptionStatus } from "@/components/subscription/SubscriptionContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type CancellationStep = 'idle' | 'processing' | 'success' | 'redirecting';

export default function CancelSubscriptionPage() {
  const { user } = useAuth();
  const { subscription, isLoading: subscriptionLoading, refreshSubscription } = useSubscription();
  const router = useRouter();
  const [cancellationStep, setCancellationStep] = useState<CancellationStep>('idle');
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    // Redirect if no active subscription or if already cancelled
    if (!subscriptionLoading && (!subscription || 
        subscription.status !== "active" || 
        subscription.cancel_at_period_end)) {
      router.push("/profile");
    }
  }, [user, subscription, subscriptionLoading, router]);

  const getCancellationMessage = () => {
    if (!subscription) return null;

    const isYearlyPlan = subscription.planType === "student_yearly";
    const renewalDate = new Date(subscription.currentPeriodEnd);
    const formattedDate = renewalDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // If already cancelled, show different message
    if (subscription.cancel_at_period_end) {
      return {
        warning: `Your subscription has been scheduled for cancellation. Your access will continue until ${formattedDate}.`,
        description: "Your subscription has been scheduled for cancellation. You will continue to have access to all premium features until the end of your billing period."
      };
    }

    if (isYearlyPlan) {
      return {
        warning: `Your subscription will remain active until ${formattedDate}. You will continue to have access to all premium features until then.`,
        description: "We're sorry to see you go. You can cancel your yearly subscription below. Your access will continue until the end of your current billing period."
      };
    }

    return {
      warning: "Warning: Canceling your subscription will end your access immediately. You will no longer have access to premium features after cancellation.",
      description: "We're sorry to see you go. You can cancel your subscription below."
    };
  };

  const handleCancel = async () => {
    if (!user || !subscription) return;

    setCancellationStep('processing');
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/stripe/cancel-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscriptionId: subscription.subscriptionId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to cancel subscription");
      }

      // Show the specific message from the API
      setSuccess(data.message || "Your subscription has been updated.");
      
      // Refresh the subscription data
      await refreshSubscription();

      // Set success state
      setCancellationStep('success');
      
      // Wait 3 seconds in success state before starting redirect
      setTimeout(() => {
        setCancellationStep('redirecting');
        // Wait another 3 seconds before actually redirecting
        setTimeout(() => {
          router.push("/");
        }, 3000);
      }, 3000);
    } catch (error) {
      logger.error("Error canceling subscription:", error);
      setError(error instanceof Error ? error.message : "Failed to cancel subscription");
      setCancellationStep('idle');
    }
  };

  const isLoading = subscriptionLoading || (cancellationStep as CancellationStep) === 'processing';

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-muted-foreground">
          {(cancellationStep as CancellationStep) === 'processing' ? "Processing your cancellation..." : "Loading subscription details..."}
        </p>
      </div>
    );
  }

  // Redirect if no subscription or if subscription is already in a terminal state
  if (!subscription || 
      subscription.status !== "active" || 
      subscription.cancel_at_period_end) {
    return null; // Will redirect in useEffect
  }

  const renewalDate = new Date(subscription.currentPeriodEnd);
  const isExpired = isNaN(renewalDate.getTime());
  const subscriptionStatus = subscription.status as SubscriptionStatus;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto">
          <div className="flex h-16 items-center px-4 sm:px-6 lg:px-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/profile")}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
              disabled={cancellationStep !== 'idle'}
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Profile</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Cancel Subscription</CardTitle>
              <CardDescription>
                {subscriptionStatus === "incomplete_expired" ? (
                  "Your subscription was never activated. You can start a new subscription when you're ready."
                ) : (
                  getCancellationMessage()?.description
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {cancellationStep === 'success' && (
                <Alert className="bg-green-50 border-green-200">
                  <AlertDescription className="text-green-800">
                    <div className="flex flex-col gap-2">
                      <p className="font-medium">Your subscription has been successfully cancelled.</p>
                      <p className="text-sm text-green-700">
                        {subscription.planType === "student_yearly" 
                          ? `You will maintain access until ${new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}.`
                          : "Your access will end immediately."}
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {cancellationStep === 'redirecting' && (
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertDescription className="text-blue-800">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <p>Preparing to redirect you to the home page...</p>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                {!isExpired && subscriptionStatus !== "incomplete_expired" && cancellationStep === 'idle' && (
                  <p className="text-sm text-muted-foreground">
                    {getCancellationMessage()?.warning}
                  </p>
                )}

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    variant="destructive"
                    onClick={handleCancel}
                    disabled={cancellationStep !== 'idle' || subscription.cancel_at_period_end}
                    className="flex-1"
                  >
                    {cancellationStep === 'processing' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : cancellationStep === 'success' ? (
                      "Subscription Cancelled"
                    ) : cancellationStep === 'redirecting' ? (
                      "Redirecting..."
                    ) : subscription.cancel_at_period_end ? (
                      "Subscription Already Cancelled"
                    ) : (
                      "Cancel Subscription"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/")}
                    disabled={cancellationStep !== 'idle'}
                    className="flex-1"
                  >
                    {subscription.cancel_at_period_end || cancellationStep !== 'idle' ? "Back to Home" : "Keep Subscription"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 