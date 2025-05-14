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
import { AlertCircle, Check, Code, Play, RefreshCw, Save } from "lucide-react";

interface CodeEditorProps {
  initialCode?: string;
  questionPrompt?: string;
  language?: string;
  onSubmit?: (code: string) => void;
  onRequestHint?: () => void;
}

const CodeEditor = ({
  initialCode = "// Write your Java code here\n\npublic class Solution {\n  public static void main(String[] args) {\n    // Your code here\n  }\n}",
  questionPrompt = "Write a Java program that prints the numbers from 1 to 10.",
  language = "java",
  onSubmit = () => {},
  onRequestHint = () => {},
}: CodeEditorProps) => {
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState("");
  const [hasErrors, setHasErrors] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  // Basic syntax checking (very simplified for the UI scaffolding)
  useEffect(() => {
    // This is just a placeholder for actual syntax checking
    const hasBasicErrors =
      code.includes("error") || !code.includes("public class");
    setHasErrors(hasBasicErrors);
  }, [code]);

  const handleRunCode = () => {
    setIsRunning(true);
    // Simulate code execution
    setTimeout(() => {
      if (hasErrors) {
        setOutput(
          "Error: Syntax error in your code. Please check and try again.",
        );
      } else {
        setOutput(
          "Program executed successfully!\n1\n2\n3\n4\n5\n6\n7\n8\n9\n10",
        );
      }
      setIsRunning(false);
    }, 1000);
  };

  const handleSubmitCode = () => {
    onSubmit(code);
  };

  const handleRequestHint = () => {
    onRequestHint();
  };

  return (
    <Card className="w-full bg-background border-2 shadow-lg">
      <CardContent className="p-0">
        <div className="flex flex-col h-full">
          {/* Question prompt */}
          <div className="bg-muted p-4 border-b">
            <h3 className="text-lg font-medium">Question</h3>
            <p className="mt-2">{questionPrompt}</p>
          </div>

          <Tabs defaultValue="editor" className="w-full">
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
              </TabsList>

              <div className="flex items-center gap-2">
                {hasErrors && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="text-destructive flex items-center">
                          <AlertCircle size={16} className="mr-1" />
                          <span className="text-xs">Syntax errors</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Your code contains syntax errors</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>

            <TabsContent value="editor" className="mt-0 p-0">
              <div className="relative">
                <div className="flex">
                  {/* Line numbers */}
                  <div className="bg-muted/30 text-muted-foreground p-4 text-right select-none w-12 font-mono text-sm">
                    {code.split("\n").map((_, i) => (
                      <div key={i}>{i + 1}</div>
                    ))}
                  </div>

                  {/* Code editor */}
                  <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="flex-1 p-4 font-mono text-sm bg-background resize-none outline-none min-h-[400px] overflow-auto"
                    spellCheck="false"
                    data-language={language}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="output" className="mt-0 p-0">
              <div className="bg-black text-green-400 p-4 font-mono text-sm min-h-[400px] whitespace-pre-wrap">
                {isRunning
                  ? "Running code..."
                  : output || "Run your code to see output here."}
              </div>
            </TabsContent>
          </Tabs>

          {/* Controls */}
          <div className="flex justify-between items-center p-4 bg-muted/30 border-t">
            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRequestHint}
                className="mr-2"
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
            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRunCode}
                disabled={isRunning}
                className="mr-2"
              >
                <Play size={14} className="mr-1" />
                Run Code
              </Button>
              <Button onClick={handleSubmitCode} size="sm">
                <Check size={14} className="mr-1" />
                Submit
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CodeEditor;
