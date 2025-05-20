"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronLeft, BookOpen, Code } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Reference content for each topic
const topicReferences = {
  arrays: {
    title: "Arrays & ArrayLists",
    description:
      "Working with collections of data, including 1D and 2D arrays, and ArrayList objects.",
    sections: [
      {
        title: "Array Declaration",
        content:
          "Arrays in Java are declared using square brackets. Example: `int[] numbers = new int[10];`",
        code: '// Declaring arrays\nint[] numbers = new int[10]; // Creates an array of 10 integers\nString[] names = {"Alice", "Bob", "Charlie"}; // Array with initial values\n\n// Accessing elements\nint firstNumber = numbers[0]; // Arrays are zero-indexed\nnames[1] = "Robert"; // Modifying an element',
      },
      {
        title: "ArrayList",
        content:
          "ArrayList is a resizable array implementation that can grow or shrink dynamically.",
        code: '// Creating an ArrayList\nimport java.util.ArrayList;\n\nArrayList<String> list = new ArrayList<>();\nlist.add("Apple");  // Adds element to the end\nlist.add("Banana");\nlist.add(0, "Cherry");  // Adds at specific index\n\n// Accessing and modifying\nString fruit = list.get(1);  // Gets element at index 1\nlist.set(0, "Blueberry");  // Replaces element at index 0\nlist.remove(2);  // Removes element at index 2',
      },
      {
        title: "2D Arrays",
        content:
          "Two-dimensional arrays are arrays of arrays, useful for grid-like data structures.",
        code: '// Creating a 2D array\nint[][] grid = new int[3][4];  // 3 rows, 4 columns\n\n// Initializing with values\nint[][] matrix = {\n    {1, 2, 3},\n    {4, 5, 6},\n    {7, 8, 9}\n};\n\n// Accessing elements\nint value = matrix[1][2];  // Gets the value 6 (row 1, column 2)\n\n// Iterating through a 2D array\nfor (int row = 0; row < matrix.length; row++) {\n    for (int col = 0; col < matrix[row].length; col++) {\n        System.out.print(matrix[row][col] + " ");\n    }\n    System.out.println();  // New line after each row\n}',
      },
    ],
  },
  loops: {
    title: "Loops & Control Flow",
    description:
      "For loops, while loops, nested loops, and conditional statements.",
    sections: [
      {
        title: "For Loops",
        content:
          "For loops are used when you know how many times you want to execute a block of code.",
        code: '// Basic for loop\nfor (int i = 0; i < 10; i++) {\n    System.out.println("Count: " + i);\n}\n\n// Enhanced for loop (for-each)\nint[] numbers = {1, 2, 3, 4, 5};\nfor (int num : numbers) {\n    System.out.println("Number: " + num);\n}',
      },
      {
        title: "While Loops",
        content:
          "While loops execute a block of code as long as a specified condition is true.",
        code: '// While loop\nint count = 0;\nwhile (count < 5) {\n    System.out.println("Count: " + count);\n    count++;\n}\n\n// Do-while loop (executes at least once)\nint x = 0;\ndo {\n    System.out.println("x = " + x);\n    x++;\n} while (x < 5);',
      },
      {
        title: "Nested Loops",
        content:
          "Loops can be nested inside one another for more complex iterations.",
        code: '// Nested loops for a pattern\nfor (int i = 1; i <= 5; i++) {\n    for (int j = 1; j <= i; j++) {\n        System.out.print("* ");\n    }\n    System.out.println();  // New line after each row\n}\n\n/* Output:\n* \n* * \n* * * \n* * * * \n* * * * * \n*/',
      },
    ],
  },
  oop: {
    title: "Object-Oriented Programming",
    description:
      "Classes, objects, inheritance, polymorphism, and encapsulation.",
    sections: [
      {
        title: "Classes and Objects",
        content:
          "Classes are blueprints for objects, which are instances of classes.",
        code: '// Class definition\npublic class Student {\n    // Instance variables (attributes)\n    private String name;\n    private int age;\n    \n    // Constructor\n    public Student(String name, int age) {\n        this.name = name;\n        this.age = age;\n    }\n    \n    // Methods\n    public void introduce() {\n        System.out.println("Hi, I\'m " + name + " and I\'m " + age + " years old.");\n    }\n    \n    // Getters and setters\n    public String getName() { return name; }\n    public void setName(String name) { this.name = name; }\n    public int getAge() { return age; }\n    public void setAge(int age) { this.age = age; }\n}\n\n// Creating objects\nStudent student1 = new Student("Alice", 18);\nstudent1.introduce();  // Calls the introduce method',
      },
      {
        title: "Encapsulation",
        content:
          "Encapsulation is the bundling of data and methods that operate on that data within a single unit (class).",
        code: "// Encapsulation example\npublic class BankAccount {\n    // Private instance variables\n    private double balance;\n    private String accountNumber;\n    \n    // Constructor\n    public BankAccount(String accountNumber, double initialBalance) {\n        this.accountNumber = accountNumber;\n        this.balance = initialBalance;\n    }\n    \n    // Public methods to access and modify private data\n    public double getBalance() {\n        return balance;\n    }\n    \n    public void deposit(double amount) {\n        if (amount > 0) {\n            balance += amount;\n        }\n    }\n    \n    public boolean withdraw(double amount) {\n        if (amount > 0 && balance >= amount) {\n            balance -= amount;\n            return true;\n        }\n        return false;\n    }\n}",
      },
    ],
  },
  recursion: {
    title: "Recursion",
    description:
      "Recursive methods, recursive problem solving, and recursive data structures.",
    sections: [
      {
        title: "Basic Recursion",
        content:
          "Recursion is when a method calls itself to solve a smaller instance of the same problem.",
        code: "// Factorial calculation using recursion\npublic int factorial(int n) {\n    // Base case\n    if (n == 0 || n == 1) {\n        return 1;\n    }\n    // Recursive case\n    return n * factorial(n - 1);\n}\n\n// Usage\nint result = factorial(5);  // Returns 120 (5 * 4 * 3 * 2 * 1)",
      },
      {
        title: "Fibonacci Sequence",
        content:
          "A classic example of recursion is calculating Fibonacci numbers.",
        code: "// Fibonacci calculation using recursion\npublic int fibonacci(int n) {\n    // Base cases\n    if (n <= 0) return 0;\n    if (n == 1) return 1;\n    \n    // Recursive case\n    return fibonacci(n - 1) + fibonacci(n - 2);\n}\n\n// Usage\nint fib6 = fibonacci(6);  // Returns 8 (fibonacci sequence: 0,1,1,2,3,5,8,13,...)",
      },
    ],
  },
  algorithms: {
    title: "Searching & Sorting",
    description:
      "Binary search, selection sort, insertion sort, and merge sort algorithms.",
    sections: [
      {
        title: "Binary Search",
        content:
          "Binary search is an efficient algorithm for finding an item in a sorted array.",
        code: "// Binary search implementation\npublic static int binarySearch(int[] arr, int target) {\n    int left = 0;\n    int right = arr.length - 1;\n    \n    while (left <= right) {\n        int mid = left + (right - left) / 2;\n        \n        // Check if target is at mid\n        if (arr[mid] == target) {\n            return mid;\n        }\n        \n        // If target is greater, ignore left half\n        if (arr[mid] < target) {\n            left = mid + 1;\n        }\n        // If target is smaller, ignore right half\n        else {\n            right = mid - 1;\n        }\n    }\n    \n    // Target not found\n    return -1;\n}",
      },
      {
        title: "Selection Sort",
        content:
          "Selection sort is a simple sorting algorithm that repeatedly selects the smallest element from the unsorted portion.",
        code: "// Selection sort implementation\npublic static void selectionSort(int[] arr) {\n    int n = arr.length;\n    \n    for (int i = 0; i < n - 1; i++) {\n        // Find the minimum element in unsorted array\n        int minIndex = i;\n        for (int j = i + 1; j < n; j++) {\n            if (arr[j] < arr[minIndex]) {\n                minIndex = j;\n            }\n        }\n        \n        // Swap the found minimum element with the first element\n        int temp = arr[minIndex];\n        arr[minIndex] = arr[i];\n        arr[i] = temp;\n    }\n}",
      },
      {
        title: "Merge Sort",
        content:
          "Merge sort is an efficient, divide-and-conquer sorting algorithm.",
        code: "// Merge sort implementation\npublic static void mergeSort(int[] arr, int left, int right) {\n    if (left < right) {\n        // Find the middle point\n        int mid = left + (right - left) / 2;\n        \n        // Sort first and second halves\n        mergeSort(arr, left, mid);\n        mergeSort(arr, mid + 1, right);\n        \n        // Merge the sorted halves\n        merge(arr, left, mid, right);\n    }\n}\n\nprivate static void merge(int[] arr, int left, int mid, int right) {\n    // Calculate sizes of two subarrays to be merged\n    int n1 = mid - left + 1;\n    int n2 = right - mid;\n    \n    // Create temp arrays\n    int[] L = new int[n1];\n    int[] R = new int[n2];\n    \n    // Copy data to temp arrays\n    for (int i = 0; i < n1; ++i) {\n        L[i] = arr[left + i];\n    }\n    for (int j = 0; j < n2; ++j) {\n        R[j] = arr[mid + 1 + j];\n    }\n    \n    // Merge the temp arrays\n    int i = 0, j = 0;\n    int k = left;\n    while (i < n1 && j < n2) {\n        if (L[i] <= R[j]) {\n            arr[k] = L[i];\n            i++;\n        } else {\n            arr[k] = R[j];\n            j++;\n        }\n        k++;\n    }\n    \n    // Copy remaining elements of L[] if any\n    while (i < n1) {\n        arr[k] = L[i];\n        i++;\n        k++;\n    }\n    \n    // Copy remaining elements of R[] if any\n    while (j < n2) {\n        arr[k] = R[j];\n        j++;\n        k++;\n    }\n}",
      },
    ],
  },
  inheritance: {
    title: "Inheritance & Interfaces",
    description:
      "Class hierarchies, method overriding, abstract classes, and interfaces.",
    sections: [
      {
        title: "Inheritance Basics",
        content:
          "Inheritance allows a class to inherit attributes and methods from another class.",
        code: '// Base class (parent)\npublic class Shape {\n    protected String color;\n    \n    public Shape(String color) {\n        this.color = color;\n    }\n    \n    public double calculateArea() {\n        return 0.0;  // Default implementation\n    }\n    \n    public String getColor() {\n        return color;\n    }\n}\n\n// Derived class (child)\npublic class Circle extends Shape {\n    private double radius;\n    \n    public Circle(String color, double radius) {\n        super(color);  // Call to parent constructor\n        this.radius = radius;\n    }\n    \n    @Override\n    public double calculateArea() {\n        return Math.PI * radius * radius;\n    }\n}\n\n// Usage\nCircle circle = new Circle("Red", 5.0);\nSystem.out.println("Area: " + circle.calculateArea());\nSystem.out.println("Color: " + circle.getColor());',
      },
      {
        title: "Interfaces",
        content:
          "Interfaces define a contract of methods that implementing classes must provide.",
        code: '// Interface definition\npublic interface Drawable {\n    void draw();  // Abstract method (no implementation)\n    \n    // Default method (with implementation)\n    default void displayInfo() {\n        System.out.println("This is a drawable object.");\n    }\n}\n\n// Class implementing the interface\npublic class Rectangle implements Drawable {\n    private double width;\n    private double height;\n    \n    public Rectangle(double width, double height) {\n        this.width = width;\n        this.height = height;\n    }\n    \n    @Override\n    public void draw() {\n        System.out.println("Drawing a rectangle with width " + width + " and height " + height);\n    }\n}\n\n// Usage\nRectangle rect = new Rectangle(10, 5);\nrect.draw();  // Calls the implemented method\nrect.displayInfo();  // Calls the default method from the interface',
      },
      {
        title: "Abstract Classes",
        content:
          "Abstract classes cannot be instantiated and may contain abstract methods that must be implemented by subclasses.",
        code: '// Abstract class\npublic abstract class Animal {\n    protected String name;\n    \n    public Animal(String name) {\n        this.name = name;\n    }\n    \n    // Abstract method (no implementation)\n    public abstract void makeSound();\n    \n    // Concrete method (with implementation)\n    public void eat() {\n        System.out.println(name + " is eating.");\n    }\n}\n\n// Concrete subclass\npublic class Dog extends Animal {\n    public Dog(String name) {\n        super(name);\n    }\n    \n    @Override\n    public void makeSound() {\n        System.out.println(name + " says: Woof!");\n    }\n}\n\n// Usage\nDog dog = new Dog("Rex");\ndog.makeSound();  // Calls the implemented abstract method\ndog.eat();  // Calls the inherited concrete method',
      },
    ],
  },
};

export default function ReferenceTopicPage() {
  const params = useParams();
  const router = useRouter();
  const topicId = params.topicId as string;

  // Get the topic reference data
  const topicData = topicReferences[topicId as keyof typeof topicReferences];

  if (!topicData) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/" className="flex items-center">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground mb-4">
              Reference information for this topic is not available yet.
            </p>
            <Button asChild>
              <Link href="/">Return to Dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <BookOpen className="mr-2 h-6 w-6" /> {topicData.title}{" "}
                Reference
              </h1>
              <p className="text-muted-foreground mt-2">
                {topicData.description}
              </p>
            </div>
            <Button
              onClick={() => router.push(`/practice/${topicId}`)}
              className="flex items-center gap-2"
            >
              <Code className="h-4 w-4" />
              Practice This Topic
            </Button>
          </div>
        </div>

        <div className="space-y-8">
          {topicData.sections.map((section, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle>{section.title}</CardTitle>
                <CardDescription>{section.content}</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                  <code>{section.code}</code>
                </pre>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
