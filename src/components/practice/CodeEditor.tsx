"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertCircle, Check, Code, Play, RefreshCw, Save, X, Plus, Printer, Trash2, Pencil } from "lucide-react";
import Editor from "@monaco-editor/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CodeEditorProps {
  initialCode?: string;
  questionPrompt?: string;
  testCases?: {
    input: string;
    expectedOutput: string;
    description?: string;
  }[];
  onSubmit?: (code: string) => void;
  onRequestHint?: () => void;
}

const CodeEditor = ({
  initialCode = "public static int sumEvenNumbers(int[] numbers) {\n    // Write your code here\n    int sum = 0;\n    for (int num : numbers) {\n        if (num % 2 == 0) {\n            sum += num;\n        }\n    }\n    return sum;\n}",
  questionPrompt = "Write a method that sums all even numbers in an array. The method should be static and take an array of integers as input.",
  testCases = [
    {
      input: "new int[] {1, 2, 3, 4, 5, 6, 7, 8, 9, 10}",
      expectedOutput: "30",
      description: "Array with even numbers from 1 to 10"
    },
    {
      input: "new int[] {2, 4, 6, 8}",
      expectedOutput: "20",
      description: "Array with only even numbers"
    },
    {
      input: "new int[] {1, 3, 5, 7}",
      expectedOutput: "0",
      description: "Array with no even numbers"
    }
  ],
  onSubmit = () => {},
  onRequestHint = () => {},
}: CodeEditorProps) => {
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState("");
  const [hasErrors, setHasErrors] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState("editor");
  const [errorMessage, setErrorMessage] = useState("");
  const [testResults, setTestResults] = useState<Array<{
    passed: boolean;
    actualOutput: string;
    error?: string;
  }>>([]);
  const [customTestCases, setCustomTestCases] = useState<Array<{
    input: string;
    expectedOutput: string;
    description?: string;
  }>>([]);
  const [isCustomTestOpen, setIsCustomTestOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newTestCase, setNewTestCase] = useState({
    input: "",
    expectedOutput: "",
    description: ""
  });

  const handleAddCustomTestCase = () => {
    if (newTestCase.input && newTestCase.expectedOutput) {
      if (editingIndex !== null) {
        // Update existing test case
        const newCustomTestCases = [...customTestCases];
        newCustomTestCases[editingIndex - testCases.length] = newTestCase;
        setCustomTestCases(newCustomTestCases);
      } else {
        // Add new test case
        setCustomTestCases([...customTestCases, newTestCase]);
      }
      setNewTestCase({ input: "", expectedOutput: "", description: "" });
      setEditingIndex(null);
      setIsCustomTestOpen(false);
    }
  };

  const handleEditTestCase = (index: number) => {
    const testCase = customTestCases[index - testCases.length];
    setNewTestCase({
      input: testCase.input,
      expectedOutput: testCase.expectedOutput,
      description: testCase.description || ""
    });
    setEditingIndex(index);
    setIsCustomTestOpen(true);
  };

  const handleDeleteTestCase = (index: number) => {
    const newCustomTestCases = [...customTestCases];
    newCustomTestCases.splice(index - testCases.length, 1);
    setCustomTestCases(newCustomTestCases);
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    setOutput("Running test cases...");
    setActiveTab("output");
    setHasErrors(false);
    setErrorMessage("");
    setTestResults([]);
    
    // Combine default and custom test cases
    const allTestCases = [...testCases, ...customTestCases];
    
    // Ensure the method is declared as static
    let processedCode = code;
    if (!code.includes("public static")) {
      processedCode = code.replace("public ", "public static ");
    }
    
    const results = [];
    let executionOutput = "";
    
    for (const testCase of allTestCases) {
      // Wrap the user's method in a Solution class with a main method that calls it
      const codeToExecute = `public class Solution {
    ${processedCode}
    
    public static void main(String[] args) {
        try {
            // Capture both return value and any System.out.println output
            java.io.ByteArrayOutputStream outputStream = new java.io.ByteArrayOutputStream();
            java.io.PrintStream originalOut = System.out;
            System.setOut(new java.io.PrintStream(outputStream));
            
            int result = sumEvenNumbers(${testCase.input});
            
            // Get any printed output before restoring System.out
            String printedOutput = outputStream.toString().trim();
            
            // Restore original System.out
            System.setOut(originalOut);
            
            // Print both the return value and any printed output
            if (!printedOutput.isEmpty()) {
                System.out.println("Printed output: " + printedOutput);
            }
            System.out.println("Return value: " + result);
        } catch (Exception e) {
            System.out.println("Error: " + e.getMessage());
        }
    }
}`;
      
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          mode: 'cors',
          credentials: 'omit',
          body: JSON.stringify({ code: codeToExecute }),
        });

        const result = await response.json();

        if (!response.ok) {
          results.push({
            passed: false,
            actualOutput: "",
            error: `Server error: ${result.error || 'Unknown error'}`
          });
          setHasErrors(true);
          setErrorMessage(result.error || 'Server error');
        } else if (result.error) {
          const formattedError = result.error
            .replace(/\/tmp\/[^:]+:/g, '')
            .replace(/Solution.java:/g, '')
            .trim();
          
          results.push({
            passed: false,
            actualOutput: "",
            error: formattedError
          });
          setHasErrors(true);
          setErrorMessage(formattedError);
        } else {
          const actualOutput = result.output.trim();
          const returnValueMatch = actualOutput.match(/Return value: (\d+)/);
          const returnValue = returnValueMatch ? returnValueMatch[1] : actualOutput;
          const passed = returnValue === testCase.expectedOutput;
          
          results.push({
            passed,
            actualOutput: actualOutput,
            error: passed ? undefined : `Expected ${testCase.expectedOutput}, got ${returnValue}`
          });

          // Add to execution output
          executionOutput += `Test Case ${results.length}\n`;
          executionOutput += `Input: ${testCase.input}\n`;
          executionOutput += actualOutput + "\n\n";
        }
      } catch (error: any) {
        const errorMessage = error.message || 'Unknown error occurred';
        results.push({
          passed: false,
          actualOutput: "",
          error: errorMessage
        });
        setHasErrors(true);
        setErrorMessage(errorMessage);
      }
    }

    setTestResults(results);
    
    // Generate simplified summary output
    const totalTests = results.length;
    const passedTests = results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;

    let summary = `Test Results Summary:
Total Tests: ${totalTests}
Passed: ${passedTests}
Failed: ${failedTests}

Console Outputs:`;

    // Add console outputs to summary
    results.forEach((result, index) => {
      const printedOutputMatch = result.actualOutput.match(/Printed output: (.*?)(?=\nReturn value:|$)/);
      const output = printedOutputMatch ? printedOutputMatch[1].trim() : 'no console output';
      summary += `\nTest ${index + 1}: ${output}`;
    });

    // Add extra newline after console outputs
    summary += '\n\n';

    // Format execution details
    let executionDetails = 'Execution Details:\n';
    results.forEach((result, index) => {
      const testCase = allTestCases[index];
      executionDetails += `Test Case ${index + 1}\n`;
      executionDetails += `Input: ${testCase.input}\n`;
      
      // Extract and add console output
      const printedOutputMatch = result.actualOutput.match(/Printed output: (.*?)(?=\nReturn value:|$)/);
      if (printedOutputMatch) {
        executionDetails += `Console: ${printedOutputMatch[1].trim()}\n`;
      }
      
      // Extract and add return value
      const returnValueMatch = result.actualOutput.match(/Return value: (\d+)/);
      if (returnValueMatch) {
        executionDetails += `Return: ${returnValueMatch[1]}\n`;
      }
      
      // Add extra newline between test cases
      executionDetails += '\n';
    });

    // Combine summary and execution output
    const finalOutput = `${summary}${executionDetails.trim()}`;
    console.log("Final output:", finalOutput);
    setOutput(finalOutput);
    setIsRunning(false);
  };

  const handleRequestHint = () => {
    onRequestHint();
  };

  const getTestStatusIcon = () => {
    if (testResults.length === 0) return null;
    
    const failedTests = testResults.filter(result => !result.passed).length;
    if (failedTests === 0) {
      return (
        <div className="text-green-600 flex items-center">
          <Check size={16} className="mr-1" />
          <span className="text-xs">All Tests Passed</span>
        </div>
      );
    } else if (failedTests === testResults.length) {
      return (
        <div className="text-red-600 flex items-center">
          <X size={16} className="mr-1" />
          <span className="text-xs">All Tests Failed</span>
        </div>
      );
    } else {
      return (
        <div className="text-red-600 flex items-center">
          <X size={16} className="mr-1" />
          <span className="text-xs">{failedTests} Failed</span>
        </div>
      );
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Code Test Results</title>
            <style>
              body { font-family: monospace; padding: 20px; }
              .test-case { margin-bottom: 20px; padding: 10px; border: 1px solid #ccc; }
              .passed { color: green; }
              .failed { color: red; }
              .code { background: #f5f5f5; padding: 10px; margin: 10px 0; }
            </style>
          </head>
          <body>
            <h2>Code Test Results</h2>
            <div class="code">
              <pre>${code}</pre>
            </div>
            <h3>Test Results</h3>
            ${output.split('\n\n').map(section => `
              <div class="test-case">
                <pre>${section}</pre>
              </div>
            `).join('')}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <Card className="w-full bg-background border-2 shadow-lg">
      <CardContent className="p-0">
        <div className="flex flex-col h-full">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex justify-between items-center bg-muted/50 px-4 py-2 border-b">
              <TabsList>
                <TabsTrigger value="editor" className="flex items-center gap-2">
                  <Code size={16} />
                  Editor
                </TabsTrigger>
                <TabsTrigger value="output" className="flex items-center gap-2">
                  <Play size={16} />
                  Output
                </TabsTrigger>
                <TabsTrigger value="testcases" className="flex items-center gap-2">
                  {getTestStatusIcon() || <Check size={16} />}
                  Test Cases
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-2">
                {hasErrors && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="text-destructive flex items-center">
                          <AlertCircle size={16} className="mr-1" />
                          <span className="text-xs">Compilation Error</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs whitespace-pre-wrap">{errorMessage}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>

            <TabsContent value="editor" className="mt-0 p-0">
              <div className="relative h-[400px]">
                <Editor
                  height="400px"
                  defaultLanguage="java"
                  theme="vs-light"
                  value={code}
                  onChange={(value) => setCode(value || '')}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: "on",
                    roundedSelection: false,
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 4,
                    wordWrap: "on",
                    formatOnPaste: true,
                    formatOnType: true,
                  }}
                />
              </div>
            </TabsContent>

            <TabsContent value="output" className="mt-0 p-0">
              <div className="bg-background border p-4 font-mono text-sm min-h-[400px] max-h-[600px] overflow-y-auto whitespace-pre-wrap">
                {isRunning ? (
                  "Running test cases..."
                ) : output ? (
                  <pre className="whitespace-pre-wrap">{output}</pre>
                ) : (
                  "Run your code to see output here."
                )}
              </div>
            </TabsContent>

            <TabsContent value="testcases" className="mt-0 p-0">
              <div className="p-4 min-h-[400px] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <Dialog 
                    open={isCustomTestOpen} 
                    onOpenChange={(open) => {
                      if (!open) {
                        setNewTestCase({ input: "", expectedOutput: "", description: "" });
                        setEditingIndex(null);
                      }
                      setIsCustomTestOpen(open);
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="flex items-center gap-2">
                        <Plus size={14} />
                        Add Custom Test
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {editingIndex !== null ? 'Edit Test Case' : 'Add Custom Test Case'}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Description (optional)</Label>
                          <Input
                            value={newTestCase.description}
                            onChange={(e) => setNewTestCase({ ...newTestCase, description: e.target.value })}
                            placeholder="Test case description"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Input</Label>
                          <Input
                            value={newTestCase.input}
                            onChange={(e) => setNewTestCase({ ...newTestCase, input: e.target.value })}
                            placeholder="e.g., new int[] {1, 2, 3}"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Expected Output</Label>
                          <Input
                            value={newTestCase.expectedOutput}
                            onChange={(e) => setNewTestCase({ ...newTestCase, expectedOutput: e.target.value })}
                            placeholder="e.g., 6"
                          />
                        </div>
                        <Button onClick={handleAddCustomTestCase}>
                          {editingIndex !== null ? 'Save Changes' : 'Add Test Case'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button variant="outline" size="sm" onClick={handlePrint} className="flex items-center gap-2">
                    <Printer size={14} />
                    Print Results
                  </Button>
                </div>
                <div className="space-y-4">
                  {[...testCases, ...customTestCases].map((testCase, index) => (
                    <div key={index} className="bg-muted/50 p-4 rounded-lg relative">
                      {index >= testCases.length && (
                        <div className="absolute top-2 right-2 flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-blue-600"
                            onClick={() => handleEditTestCase(index)}
                          >
                            <Pencil size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteTestCase(index)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      )}
                      {testCase.description && (
                        <p className="text-sm font-medium mb-2">{testCase.description}</p>
                      )}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Input:</p>
                          <pre className="bg-background p-2 rounded text-sm overflow-x-auto">
                            <code>{testCase.input}</code>
                          </pre>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Expected Output:</p>
                          <pre className="bg-background p-2 rounded text-sm overflow-x-auto">
                            <code>{testCase.expectedOutput}</code>
                          </pre>
                        </div>
                      </div>
                      {testResults[index] && (
                        <div className={`mt-2 p-2 rounded text-sm ${testResults[index].passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {testResults[index].passed ? '✓ Passed' : `✗ Failed: ${testResults[index].error}`}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Controls */}
          <div className="flex justify-between items-center p-4 bg-muted/30 border-t">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRequestHint}
              >
                Request Hint
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCode(initialCode)}
              >
                <RefreshCw size={14} className="mr-1" />
                Reset
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRunCode}
              disabled={isRunning}
            >
              <Play size={14} className="mr-1" />
              Run Test Cases
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CodeEditor;
