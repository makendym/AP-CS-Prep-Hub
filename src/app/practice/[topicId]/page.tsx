"use client";

import { useParams, useSearchParams } from "next/navigation";
import PracticeInterface from "@/components/practice/PracticeInterface";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronLeft, BookOpen, Code } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BackToDashboard } from "@/components/ui/back-to-dashboard";

// Update the question type definition
interface Question {
  id: string;
  type: "MCQ" | "FRQ";
  text: string;
  topic: string;
  source: 'official' | 'ai-generated';
  difficulty: 'easy' | 'medium' | 'hard';
  options?: string[];
  correctAnswer?: string;
  codeTemplate?: string;
}

// Mock questions data - in a real app, this would come from an API or database
const topicQuestions: Record<string, Question[]> = {
  arrays: [
    {
      id: "q1",
      type: "MCQ",
      text: "Which of the following correctly declares an array of integers in Java?",
      topic: "Arrays",
      source: 'official',
      difficulty: 'easy',
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
      source: 'ai-generated',
      difficulty: 'medium',
      codeTemplate:
        "public int sumEvenNumbers(int[] arr) {\n    // Your code here\n    \n}",
    },
  ],
  loops: [
    {
      id: "q3",
      type: "MCQ",
      text: "Which loop is guaranteed to execute at least once?",
      topic: "Loops",
      source: 'official',
      difficulty: 'easy',
      options: ["for loop", "while loop", "do-while loop", "for-each loop"],
      correctAnswer: "do-while loop",
    },
    {
      id: "q4",
      type: "FRQ",
      text: "Write a method that uses nested loops to print a pattern of stars in the shape of a right triangle.",
      topic: "Loops",
      source: 'ai-generated',
      difficulty: 'medium',
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
      source: 'official',
      difficulty: 'easy',
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
      source: 'ai-generated',
      difficulty: 'medium',
      codeTemplate: "public class Student {\n    // Your code here\n    \n}",
    },
  ],
  recursion: [
    {
      id: "q7",
      type: "MCQ" as const,
      text: "What is the base case in a recursive function?",
      topic: "Recursion",
      source: 'official',
      difficulty: 'easy',
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
      source: 'ai-generated',
      difficulty: 'medium',
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
      source: 'official',
      difficulty: 'easy',
      options: ["O(n)", "O(n²)", "O(log n)", "O(n log n)"],
      correctAnswer: "O(log n)",
    },
    {
      id: "q10",
      type: "FRQ" as const,
      text: "Implement the merge sort algorithm for an array of integers.",
      topic: "Searching & Sorting",
      source: 'ai-generated',
      difficulty: 'medium',
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
      source: 'official',
      difficulty: 'easy',
      options: ["extends", "implements", "inherits", "super"],
      correctAnswer: "extends",
    },
    {
      id: "q12",
      type: "FRQ" as const,
      text: "Create a class hierarchy with a base class 'Shape' and derived classes 'Circle' and 'Rectangle'.",
      topic: "Inheritance & Interfaces",
      source: 'ai-generated',
      difficulty: 'medium',
      codeTemplate:
        "public class Shape {\n    // Your code here\n    \n}\n\npublic class Circle extends Shape {\n    // Your code here\n    \n}\n\npublic class Rectangle extends Shape {\n    // Your code here\n    \n}",
    },
  ],
};

// Add these types at the top
type QuestionSource = 'official' | 'ai-generated';
type QuestionType = 'mcq' | 'frq' | 'mixed';
type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'all';

interface PracticeParams {
  source: QuestionSource;
  type: QuestionType;
  difficulty: DifficultyLevel;
  mode?: 'random';
}

export default function PracticePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const topicId = params.topicId as string;
  const questionId = searchParams.get("questionId");
  const mode = searchParams.get("mode");

  // Parse practice parameters
  const practiceParams: PracticeParams = {
    source: (searchParams.get("source") as QuestionSource) || 'official',
    type: (searchParams.get("type") as QuestionType) || 'mixed',
    difficulty: (searchParams.get("difficulty") as DifficultyLevel) || 'all',
    mode: searchParams.get("mode") as 'random' || undefined
  };

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

  // Get questions for this topic with filters applied
  let questions = topicQuestions[actualTopicId as keyof typeof topicQuestions] || [];

  // Apply filters
  questions = questions.filter(question => {
    // Filter by source (official vs AI-generated)
    // This would come from your database in a real app
    const isOfficial = question.source === 'official';
    if (practiceParams.source === 'official' && !isOfficial) return false;
    if (practiceParams.source === 'ai-generated' && isOfficial) return false;

    // Filter by type
    if (practiceParams.type !== 'mixed') {
      if (practiceParams.type === 'mcq' && question.type !== 'MCQ') return false;
      if (practiceParams.type === 'frq' && question.type !== 'FRQ') return false;
    }

    // Filter by difficulty
    if (practiceParams.difficulty !== 'all') {
      if (question.difficulty !== practiceParams.difficulty) return false;
    }

    return true;
  });

  // If in random mode, shuffle the questions
  if (practiceParams.mode === 'random') {
    questions = questions.sort(() => Math.random() - 0.5);
  }

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
          <BackToDashboard />
          <h1 className="text-3xl font-bold">
            {mode === "retry" ? "Retry Question" : `${topicName} Practice`}
          </h1>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="outline">
              {practiceParams.source === 'official' ? 'Official AP Questions' : 'AI-Generated Practice'}
            </Badge>
            <Badge variant="outline">
              {practiceParams.type === 'mixed' ? 'Mixed Practice' : 
               practiceParams.type === 'mcq' ? 'MCQ Only' : 'FRQ Only'}
            </Badge>
            {practiceParams.difficulty !== 'all' && (
              <Badge variant="outline">
                {practiceParams.difficulty.charAt(0).toUpperCase() + practiceParams.difficulty.slice(1)} Difficulty
              </Badge>
            )}
            {practiceParams.mode === 'random' && (
              <Badge variant="outline">Random Practice</Badge>
            )}
          </div>
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
