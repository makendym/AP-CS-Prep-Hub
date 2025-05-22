"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, HelpCircle } from "lucide-react";
import CodeEditor from "./CodeEditor";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Question {
  id: string;
  type: "MCQ" | "FRQ";
  text: string;
  topic: string;
  options?: string[];
  correctAnswer?: string;
  codeTemplate?: string;
}

interface PracticeInterfaceProps {
  questions?: Question[];
  topic?: string;
  onSubmit?: (questionId: string, answer: string | string[]) => void;
  onComplete?: () => void;
}

export default function PracticeInterface({
  questions = [
    {
      id: "q1",
      type: "MCQ",
      text: "Which of the following correctly declares an array of integers in Java?",
      topic: "Arrays",
      options: [
        "int numbers[];",
        "int[] numbers = new int[10];",
        "int numbers = new int[];",
        "array int[] numbers;",
      ],
      correctAnswer: "int[] numbers = new int[10];",
    },
    {
      id: "q2",
      type: "FRQ",
      text: "Write a method that takes an array of integers and returns the sum of all even numbers in the array.",
      topic: "Arrays",
      codeTemplate:
        "public int sumEvenNumbers(int[] arr) {\n    // Your code here\n    \n}",
    },
  ],
  topic = "Arrays",
  onSubmit = () => {},
  onComplete = () => {},
}: PracticeInterfaceProps) {
  const router = useRouter();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [codeAnswer, setCodeAnswer] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState<any[]>([]);

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption("");
      setCodeAnswer("");
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = () => {
    setIsSubmitting(true);

    // Create answer data for current question
    const answerData = {
      ...currentQuestion, // Include all question data
      isCorrect: currentQuestion.type === "MCQ" 
        ? selectedOption === currentQuestion.correctAnswer
        : true, // This should be evaluated based on code submission
      selectedOption: currentQuestion.type === "MCQ" ? selectedOption : undefined,
      studentCode: currentQuestion.type === "FRQ" ? codeAnswer : undefined,
      explanation: currentQuestion.type === "MCQ"
        ? "This question tests your understanding of Java syntax and array declaration."
        : "Your solution correctly implements the required functionality.",
      rubricItems: currentQuestion.type === "FRQ" ? [
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
      ] : undefined,
      totalPoints: 5,
      earnedPoints: 5,
    };

    // Add to answered questions
    const newAnsweredQuestions = [...answeredQuestions, answerData];
    setAnsweredQuestions(newAnsweredQuestions);

    // Submit the answer based on question type
    if (currentQuestion.type === "MCQ") {
      onSubmit(currentQuestion.id, selectedOption);
    } else {
      onSubmit(currentQuestion.id, codeAnswer);
    }

    // Simulate API call delay
    setTimeout(() => {
      setIsSubmitting(false);
      if (currentQuestionIndex < questions.length - 1) {
        handleNext();
      } else {
        // Navigate to feedback view with all questions data
        const params = new URLSearchParams({
          topic: topic,
          questions: encodeURIComponent(JSON.stringify(newAnsweredQuestions))
        });
        router.push(`/results?${params.toString()}`);
      }
    }, 1000);
  };

  const handleCodeChange = (code: string) => {
    setCodeAnswer(code);
  };

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto bg-background">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <h2 className="text-xl font-bold mr-2">{topic} Practice</h2>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <HelpCircle className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Practice questions for {topic}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="text-sm text-muted-foreground">
          Question {currentQuestionIndex + 1} of {questions.length}
        </div>
      </div>

      <Progress value={progress} className="mb-6" />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">
            {currentQuestion.type === "MCQ"
              ? "Multiple Choice Question"
              : "Free Response Question"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <p className="text-base mb-4">{currentQuestion.text}</p>

            {currentQuestion.type === "MCQ" ? (
              <RadioGroup
                value={selectedOption}
                onValueChange={setSelectedOption}
              >
                {currentQuestion.options?.map((option, index) => (
                  <div key={index} className="flex items-start space-x-2 mb-3">
                    <RadioGroupItem value={option} id={`option-${index}`} />
                    <Label htmlFor={`option-${index}`} className="text-sm">
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            ) : (
              <CodeEditor
                initialCode={currentQuestion.codeTemplate || ""}
                onSubmit={handleCodeChange}
              />
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
          >
            <ChevronLeft className="mr-2 h-4 w-4" /> Previous
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              (currentQuestion.type === "MCQ" && !selectedOption)
            }
          >
            {isSubmitting ? "Submitting..." : "Submit & Continue"}
          </Button>
        </CardFooter>
      </Card>

      <Tabs defaultValue="instructions" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="instructions">Instructions</TabsTrigger>
          <TabsTrigger value="hints">Hints</TabsTrigger>
        </TabsList>
        <TabsContent
          value="instructions"
          className="p-4 border rounded-md mt-2"
        >
          <h3 className="font-medium mb-2">Instructions</h3>
          <p className="text-sm text-muted-foreground">
            {currentQuestion.type === "MCQ"
              ? "Select the best answer from the options provided."
              : "Write your code solution in the editor above. Make sure your code compiles and meets all requirements."}
          </p>
        </TabsContent>
        <TabsContent value="hints" className="p-4 border rounded-md mt-2">
          <h3 className="font-medium mb-2">Hints</h3>
          <p className="text-sm text-muted-foreground">
            {currentQuestion.type === "MCQ"
              ? "Consider the syntax requirements for array declaration in Java."
              : "Remember to handle edge cases like empty arrays or arrays with no even numbers."}
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
