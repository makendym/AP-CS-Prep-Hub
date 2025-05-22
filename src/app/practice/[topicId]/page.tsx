"use client";

import { useParams, useSearchParams } from "next/navigation";
import PracticeInterface from "@/components/practice/PracticeInterface";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

// Mock questions data - in a real app, this would come from an API or database
const topicQuestions = {
  arrays: [
    {
      id: "q1",
      type: "MCQ" as const,
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
      type: "FRQ" as const,
      text: "Write a method that takes an array of integers and returns the sum of all even numbers in the array.",
      topic: "Arrays",
      codeTemplate:
        "public int sumEvenNumbers(int[] arr) {\n    // Your code here\n    \n}",
    },
  ],
  loops: [
    {
      id: "q3",
      type: "MCQ" as const,
      text: "Which loop is guaranteed to execute at least once?",
      topic: "Loops",
      options: ["for loop", "while loop", "do-while loop", "for-each loop"],
      correctAnswer: "do-while loop",
    },
    {
      id: "q4",
      type: "FRQ" as const,
      text: "Write a method that uses nested loops to print a pattern of stars in the shape of a right triangle.",
      topic: "Loops",
      codeTemplate:
        "public void printStarPattern(int rows) {\n    // Your code here\n    \n}",
    },
  ],
  oop: [
    {
      id: "q5",
      type: "MCQ" as const,
      text: "Which of the following is NOT a principle of object-oriented programming?",
      topic: "Object-Oriented Programming",
      options: [
        "Encapsulation",
        "Inheritance",
        "Polymorphism",
        "Fragmentation",
      ],
      correctAnswer: "Fragmentation",
    },
    {
      id: "q6",
      type: "FRQ" as const,
      text: "Create a class called 'Student' with appropriate instance variables and methods.",
      topic: "Object-Oriented Programming",
      codeTemplate: "public class Student {\n    // Your code here\n    \n}",
    },
  ],
  recursion: [
    {
      id: "q7",
      type: "MCQ" as const,
      text: "What is the base case in a recursive function?",
      topic: "Recursion",
      options: [
        "The case where the function calls itself",
        "The case where the function returns without calling itself",
        "The first line of the function",
        "The case that is executed most frequently",
      ],
      correctAnswer:
        "The case where the function returns without calling itself",
    },
    {
      id: "q8",
      type: "FRQ" as const,
      text: "Write a recursive method to calculate the factorial of a number.",
      topic: "Recursion",
      codeTemplate:
        "public int factorial(int n) {\n    // Your code here\n    \n}",
    },
  ],
  algorithms: [
    {
      id: "q9",
      type: "MCQ" as const,
      text: "What is the time complexity of binary search?",
      topic: "Searching & Sorting",
      options: ["O(n)", "O(n²)", "O(log n)", "O(n log n)"],
      correctAnswer: "O(log n)",
    },
    {
      id: "q10",
      type: "FRQ" as const,
      text: "Implement the merge sort algorithm for an array of integers.",
      topic: "Searching & Sorting",
      codeTemplate:
        "public void mergeSort(int[] arr) {\n    // Your code here\n    \n}",
    },
  ],
  inheritance: [
    {
      id: "q11",
      type: "MCQ" as const,
      text: "Which keyword is used to inherit a class in Java?",
      topic: "Inheritance & Interfaces",
      options: ["extends", "implements", "inherits", "super"],
      correctAnswer: "extends",
    },
    {
      id: "q12",
      type: "FRQ" as const,
      text: "Create a class hierarchy with a base class 'Shape' and derived classes 'Circle' and 'Rectangle'.",
      topic: "Inheritance & Interfaces",
      codeTemplate:
        "public class Shape {\n    // Your code here\n    \n}\n\npublic class Circle extends Shape {\n    // Your code here\n    \n}\n\npublic class Rectangle extends Shape {\n    // Your code here\n    \n}",
    },
  ],
};

export default function PracticePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const topicId = params.topicId as string;
  const questionId = searchParams.get("questionId");
  const mode = searchParams.get("mode");

  // Get the topic name for display
  const topicNames: { [key: string]: string } = {
    arrays: "Arrays & ArrayLists",
    loops: "Loops & Control Flow",
    oop: "Object-Oriented Programming",
    recursion: "Recursion",
    algorithms: "Searching & Sorting",
    inheritance: "Inheritance & Interfaces",
  };

  // Map display names back to IDs
  const topicIdMap: { [key: string]: string } = {
    "arrays & arraylists": "arrays",
    "loops & control flow": "loops",
    "object-oriented programming": "oop",
    "recursion": "recursion",
    "searching & sorting": "algorithms",
    "inheritance & interfaces": "inheritance"
  };

  // Get the correct topic ID and name
  const normalizedTopicId = topicId.toLowerCase().replace(/[^a-z0-9]/g, '');
  const actualTopicId = topicIdMap[normalizedTopicId] || normalizedTopicId;
  const topicName = topicNames[actualTopicId] || topicId;

  // Get questions for this topic
  let questions = topicQuestions[actualTopicId as keyof typeof topicQuestions] || [];

  // If in retry mode and we have a questionId, filter to just that question
  if (mode === "retry" && questionId) {
    questions = questions.filter(q => q.id === questionId);
  }

  const handleSubmit = (questionId: string, answer: string | string[]) => {
    console.log(`Submitted answer for question ${questionId}:`, answer);
    // In a real app, this would send the answer to an API for evaluation
  };

  const handleComplete = () => {
    console.log("Practice session completed");
    // In a real app, this would navigate to a results page
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/" className="flex items-center">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">
            {mode === "retry" ? "Retry Question" : `${topicName} Practice`}
          </h1>
          <p className="text-muted-foreground mt-2">
            {mode === "retry" 
              ? "Try this question again"
              : "Complete the following questions to test your knowledge"}
          </p>
        </div>

        {questions.length > 0 ? (
          <PracticeInterface
            questions={questions}
            topic={topicName}
            onSubmit={handleSubmit}
            onComplete={handleComplete}
          />
        ) : (
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground mb-4">
              {mode === "retry" 
                ? "Question not found. It may have been removed."
                : "No questions available for this topic yet."}
            </p>
            <Button asChild>
              <Link href="/">Return to Dashboard</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
