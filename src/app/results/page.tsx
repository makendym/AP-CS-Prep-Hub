"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import FeedbackView from "@/components/practice/FeedbackView";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ResultsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);

  // Get result parameters from URL
  const questionType = (searchParams.get("type") as "mcq" | "frq") || "mcq";
  const isCorrect = searchParams.get("correct") === "true";
  const score = searchParams.get("score") || "0";
  const total = searchParams.get("total") || "0";
  const topic = searchParams.get("topic") || "";

  // Mock data for the feedback view
  const mockFeedbackProps = {
    questionType,
    isCorrect,
    explanation:
      questionType === "mcq"
        ? "This question tests your understanding of Java syntax and array declaration."
        : "Your solution correctly implements the required functionality. The enhanced for loop provides a cleaner way to iterate through arrays.",
    studentCode:
      "public int countEvens(int[] nums) {\n  int count = 0;\n  for (int i = 0; i < nums.length; i++) {\n    if (nums[i] % 2 == 0) {\n      count++;\n    }\n  }\n  return count;\n}",
    modelSolution:
      "public int countEvens(int[] nums) {\n  int count = 0;\n  for (int num : nums) {\n    if (num % 2 == 0) {\n      count++;\n    }\n  }\n  return count;\n}",
    rubricItems: [
      {
        id: "1",
        description: "Initializes a counter variable",
        points: 1,
        achieved: true,
      },
      {
        id: "2",
        description: "Correctly iterates through the array",
        points: 1,
        achieved: true,
      },
      {
        id: "3",
        description: "Correctly identifies even numbers",
        points: 1,
        achieved: true,
      },
      {
        id: "4",
        description: "Increments counter for even numbers",
        points: 1,
        achieved: true,
      },
      {
        id: "5",
        description: "Returns the correct count",
        points: 1,
        achieved: true,
      },
      {
        id: "6",
        description: "Uses enhanced for loop (preferred but not required)",
        points: 0,
        achieved: false,
      },
    ],
    totalPoints: parseInt(total),
    earnedPoints: parseInt(score),
  };

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const handleContinue = () => {
    router.push("/");
  };

  const handleRetry = () => {
    // Navigate back to the practice page for this topic
    if (topic) {
      router.push(`/practice/${topic}`);
    } else {
      router.push("/");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading results...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/" className="flex items-center">
              <span>Back to Dashboard</span>
            </Link>
          </Button>
        </div>

        <FeedbackView
          {...mockFeedbackProps}
          onContinue={handleContinue}
          onRetry={handleRetry}
        />
      </div>
    </div>
  );
}
