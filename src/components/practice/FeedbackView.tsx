"use client";

import React from "react";
import { CheckCircle, XCircle, Code, FileText, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface RubricItem {
  id: string;
  description: string;
  points: number;
  achieved: boolean;
}

interface FeedbackViewProps {
  questionType: "mcq" | "frq";
  isCorrect?: boolean;
  explanation?: string;
  studentCode?: string;
  modelSolution?: string;
  rubricItems?: RubricItem[];
  totalPoints?: number;
  earnedPoints?: number;
  onContinue?: () => void;
  onRetry?: () => void;
}

export default function FeedbackView({
  questionType = "mcq",
  isCorrect = false,
  explanation = "This question tests your understanding of array traversal and conditional logic.",
  studentCode = "public int countEvens(int[] nums) {\n  int count = 0;\n  for (int i = 0; i < nums.length; i++) {\n    if (nums[i] % 2 == 0) {\n      count++;\n    }\n  }\n  return count;\n}",
  modelSolution = "public int countEvens(int[] nums) {\n  int count = 0;\n  for (int num : nums) {\n    if (num % 2 == 0) {\n      count++;\n    }\n  }\n  return count;\n}",
  rubricItems = [
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
  totalPoints = 5,
  earnedPoints = 5,
  onContinue = () => {},
  onRetry = () => {},
}: FeedbackViewProps) {
  return (
    <div className="w-full max-w-4xl mx-auto p-4 bg-background">
      {/* Header with result summary */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {questionType === "mcq" ? (
            isCorrect ? (
              <CheckCircle className="h-8 w-8 text-green-500" />
            ) : (
              <XCircle className="h-8 w-8 text-red-500" />
            )
          ) : (
            <Badge variant="outline" className="text-lg py-1 px-3">
              {earnedPoints}/{totalPoints} points
            </Badge>
          )}
          <h1 className="text-2xl font-bold">
            {questionType === "mcq"
              ? isCorrect
                ? "Correct!"
                : "Incorrect"
              : "Code Evaluation"}
          </h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onRetry}>
            Try Again
          </Button>
          <Button onClick={onContinue}>
            Continue <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* MCQ Feedback */}
      {questionType === "mcq" && (
        <Card>
          <CardHeader>
            <CardTitle>Explanation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{explanation}</p>
          </CardContent>
        </Card>
      )}

      {/* FRQ Feedback */}
      {questionType === "frq" && (
        <div className="space-y-6">
          {/* Rubric Evaluation */}
          <Card>
            <CardHeader>
              <CardTitle>Rubric Evaluation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {rubricItems?.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 rounded-md border"
                  >
                    <div className="flex items-center gap-2">
                      {item.achieved ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <span>{item.description}</span>
                    </div>
                    <Badge variant={item.achieved ? "default" : "outline"}>
                      {item.points} {item.points === 1 ? "point" : "points"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4">
              <div className="w-full flex justify-between items-center">
                <span className="font-medium">Total Score:</span>
                <Badge className="text-base py-1 px-3">
                  {earnedPoints}/{totalPoints}
                </Badge>
              </div>
            </CardFooter>
          </Card>

          {/* Code Comparison */}
          <Tabs defaultValue="comparison" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="comparison">Side by Side</TabsTrigger>
              <TabsTrigger value="student">Your Solution</TabsTrigger>
              <TabsTrigger value="model">Model Solution</TabsTrigger>
            </TabsList>
            <TabsContent value="comparison" className="mt-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="py-3">
                    <div className="flex items-center">
                      <Code className="mr-2 h-4 w-4" />
                      <CardTitle className="text-sm">Your Solution</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm">
                      <code>{studentCode}</code>
                    </pre>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="py-3">
                    <div className="flex items-center">
                      <FileText className="mr-2 h-4 w-4" />
                      <CardTitle className="text-sm">Model Solution</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm">
                      <code>{modelSolution}</code>
                    </pre>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            <TabsContent value="student" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Your Solution</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm">
                    <code>{studentCode}</code>
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="model" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Model Solution</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm">
                    <code>{modelSolution}</code>
                  </pre>
                </CardContent>
                <CardFooter>
                  <p className="text-sm text-muted-foreground">
                    This is one possible correct implementation. There may be
                    other valid approaches.
                  </p>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Explanation */}
          <Card>
            <CardHeader>
              <CardTitle>Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{explanation}</p>
              <Separator className="my-4" />
              <div className="mt-4">
                <h3 className="font-medium mb-2">Key Takeaways:</h3>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  <li>
                    Your solution correctly counts even numbers in the array.
                  </li>
                  <li>
                    Consider using enhanced for loops when iterating through
                    collections for cleaner code.
                  </li>
                  <li>
                    Good job initializing and returning the counter variable.
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
