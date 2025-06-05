"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSubscription } from "@/components/subscription/SubscriptionContext";

export default function SuccessPage() {
  const router = useRouter();
  const { refreshSubscription } = useSubscription();

  useEffect(() => {
    // Refresh subscription data
    refreshSubscription().then(() => {
      // Redirect to home page after a short delay
      setTimeout(() => {
        router.push("/");
      }, 2000);
    });
  }, [router, refreshSubscription]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Payment Successful!</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Thank you for your subscription. Redirecting you to the dashboard...
        </p>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      </div>
    </div>
  );
} 