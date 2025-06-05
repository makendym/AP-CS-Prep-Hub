"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Loader2 } from "lucide-react";

interface BackToDashboardProps {
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

export function BackToDashboard({ className = "", variant = "ghost" }: BackToDashboardProps) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  const handleBack = () => {
    setIsNavigating(true);
    // Add a small delay to show the loading state
    setTimeout(() => {
      router.push("/");
    }, 300);
  };

  return (
    <Button
      variant={variant}
      onClick={handleBack}
      className={`${className}`}
      disabled={isNavigating}
    >
      {isNavigating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          <span>Loading...</span>
        </>
      ) : (
        <>
          <ChevronLeft className="mr-2 h-4 w-4" />
          <span>Back to Dashboard</span>
        </>
      )}
    </Button>
  );
} 