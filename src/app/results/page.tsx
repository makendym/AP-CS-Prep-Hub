"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import FeedbackView from "@/components/practice/FeedbackView";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

function ResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Get all questions data from URL
  const questionsData = searchParams.get("questions");
  const questions = questionsData ? JSON.parse(decodeURIComponent(questionsData)) : [];
  const topic = searchParams.get("topic") || "";

  const currentQuestion = questions[currentQuestionIndex];

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
    if (!currentQuestion) return;
    
    // Navigate back to the practice page for this specific question
    const params = new URLSearchParams({
      questionId: currentQuestion.id,
      mode: "retry"
    });
    
    // Get the topic ID from the question's topic
    const topicId = currentQuestion.topic.toLowerCase().replace(/[^a-z0-9]/g, '');
    router.push(`/practice/${topicId}?${params.toString()}`);
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
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

        {currentQuestion && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">
                Question {currentQuestionIndex + 1} of {questions.length}
              </h2>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleRetry}
                >
                  Try Again
                </Button>
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentQuestionIndex === 0}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={handleNext}
                  disabled={currentQuestionIndex === questions.length - 1}
                >
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
                {currentQuestionIndex === questions.length - 1 && (
                  <Button onClick={handleContinue}>
                    Finish
                  </Button>
                )}
              </div>
            </div>

            <FeedbackView
              questionType={currentQuestion.type.toLowerCase()}
              isCorrect={currentQuestion.isCorrect}
              explanation={currentQuestion.explanation}
              selectedOption={currentQuestion.selectedOption}
              correctAnswer={currentQuestion.correctAnswer}
              studentCode={currentQuestion.studentCode}
              modelSolution={currentQuestion.modelSolution}
              rubricItems={currentQuestion.rubricItems}
              totalPoints={currentQuestion.totalPoints}
              earnedPoints={currentQuestion.earnedPoints}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <p>Loading results...</p>
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}
