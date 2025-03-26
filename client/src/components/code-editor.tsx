import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CodeEditorProps {
  problem: {
    id: number;
    title: string;
    description: string;
    difficulty: string;
    tags: string[];
    testCases: any[];
  };
  onClose?: () => void;
}

export function CodeEditor({ problem, onClose }: CodeEditorProps) {
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("python");
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState("");
  const [analysis, setAnalysis] = useState<any>(null);

  // Set default code for each language
  useEffect(() => {
    if (language === "python") {
      setCode(`def solution(nums, target):
    # Write your solution here
    
    # Brute force approach
    # for i in range(len(nums)):
    #     for j in range(i + 1, len(nums)):
    #         if nums[i] + nums[j] == target:
    #             return [i, j]
    
    # Optimized approach with hash map
    hash_map = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in hash_map:
            return [hash_map[complement], i]
        hash_map[num] = i`);
    } else if (language === "javascript") {
      setCode(`/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function solution(nums, target) {
    // Write your solution here
    
    // Using hash map for O(n) solution
    const map = new Map();
    
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        
        if (map.has(complement)) {
            return [map.get(complement), i];
        }
        
        map.set(nums[i], i);
    }
}`);
    } else if (language === "java") {
      setCode(`class Solution {
    public int[] solution(int[] nums, int target) {
        // Write your solution here
        
        // Using HashMap for O(n) solution
        Map<Integer, Integer> map = new HashMap<>();
        
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            
            if (map.containsKey(complement)) {
                return new int[] { map.get(complement), i };
            }
            
            map.put(nums[i], i);
        }
        
        return new int[] {}; // No solution found
    }
}`);
    } else if (language === "cpp") {
      setCode(`class Solution {
public:
    vector<int> solution(vector<int>& nums, int target) {
        // Write your solution here
        
        // Using unordered_map for O(n) solution
        unordered_map<int, int> map;
        
        for (int i = 0; i < nums.size(); i++) {
            int complement = target - nums[i];
            
            if (map.find(complement) != map.end()) {
                return {map[complement], i};
            }
            
            map[nums[i]] = i;
        }
        
        return {}; // No solution found
    }
};`);
    }
  }, [language]);

  const runCode = async () => {
    setIsRunning(true);
    setOutput("");
    setAnalysis(null);
    
    try {
      // In a real implementation, we would execute the code against test cases
      // For this demo, we'll use the OpenAI API to analyze the code
      const response = await apiRequest("POST", "/api/code/analyze", {
        code,
        language,
        problemStatement: problem.description
      });
      
      const result = await response.json();
      
      // Set output based on test cases
      let outputText = "Executing against test cases:\n\n";
      
      // Mock test case execution results
      if (result.correctness) {
        outputText += "✅ All test cases passed!\n\n";
      } else {
        outputText += "❌ Failed on some test cases\n\n";
      }
      
      setOutput(outputText);
      setAnalysis(result);
    } catch (error) {
      console.error("Error running code:", error);
      toast({
        title: "Error running code",
        description: "There was a problem executing your code.",
        variant: "destructive"
      });
      setOutput("Error executing code. Please try again.");
    } finally {
      setIsRunning(false);
    }
  };

  const submitSolution = async () => {
    toast({
      title: "Solution submitted",
      description: "Your solution has been submitted successfully.",
    });
    
    // In a real implementation, we would submit the solution to the server
    // and track the user's progress
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center overflow-y-auto py-10">
      <Card className="w-full max-w-6xl h-5/6 max-h-screen flex flex-col overflow-hidden bg-white">
        <CardHeader className="p-4 border-b flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">{problem.title}</CardTitle>
            <CardDescription>
              {problem.difficulty} | {problem.tags.join(", ")}
            </CardDescription>
          </div>
          <Button 
            variant="ghost" 
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <span className="sr-only">Close</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </Button>
        </CardHeader>
        
        <div className="flex-1 flex overflow-hidden">
          {/* Problem description */}
          <div className="w-1/2 border-r p-4 overflow-y-auto">
            <h4 className="font-medium mb-3">Problem Description</h4>
            <p className="text-sm mb-4">{problem.description}</p>
            
            <h4 className="font-medium mb-2">Example:</h4>
            <div className="bg-muted p-3 rounded-lg mb-4 font-mono text-sm">
              <p><span className="text-primary">Input:</span> nums = [2,7,11,15], target = 9</p>
              <p><span className="text-primary">Output:</span> [0,1]</p>
              <p><span className="text-primary">Explanation:</span> Because nums[0] + nums[1] == 9, we return [0, 1].</p>
            </div>
            
            <h4 className="font-medium mb-2">Constraints:</h4>
            <ul className="list-disc list-inside text-sm space-y-1 mb-4">
              <li>2 &lt;= nums.length &lt;= 10<sup>4</sup></li>
              <li>-10<sup>9</sup> &lt;= nums[i] &lt;= 10<sup>9</sup></li>
              <li>-10<sup>9</sup> &lt;= target &lt;= 10<sup>9</sup></li>
              <li>Only one valid answer exists.</li>
            </ul>
            
            <h4 className="font-medium mb-2">Follow-up:</h4>
            <p className="text-sm mb-4">Can you come up with an algorithm that is less than O(n²) time complexity?</p>
          </div>
          
          {/* Code editor and output */}
          <div className="w-1/2 flex flex-col">
            {/* Language tabs */}
            <div className="border-b p-2 flex">
              <TabsList>
                <TabsTrigger 
                  value="python"
                  className={language === "python" ? "bg-primary text-primary-foreground" : ""}
                  onClick={() => setLanguage("python")}
                >
                  Python
                </TabsTrigger>
                <TabsTrigger 
                  value="javascript"
                  className={language === "javascript" ? "bg-primary text-primary-foreground" : ""}
                  onClick={() => setLanguage("javascript")}
                >
                  JavaScript
                </TabsTrigger>
                <TabsTrigger 
                  value="java"
                  className={language === "java" ? "bg-primary text-primary-foreground" : ""}
                  onClick={() => setLanguage("java")}
                >
                  Java
                </TabsTrigger>
                <TabsTrigger 
                  value="cpp"
                  className={language === "cpp" ? "bg-primary text-primary-foreground" : ""}
                  onClick={() => setLanguage("cpp")}
                >
                  C++
                </TabsTrigger>
              </TabsList>
            </div>
            
            {/* Code editor */}
            <div className="flex-1 code-editor bg-[#1e1e1e] text-white overflow-y-auto p-3">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-full bg-transparent outline-none font-mono text-sm resize-none"
                spellCheck="false"
              />
            </div>
            
            {/* Output area */}
            {(output || analysis) && (
              <div className="border-t bg-muted h-40 overflow-y-auto p-3">
                <pre className="text-sm font-mono whitespace-pre-wrap">
                  {output}
                </pre>
                
                {analysis && (
                  <div className="mt-2">
                    <Separator className="my-2" />
                    <div className="text-sm">
                      <p><strong>Time Complexity:</strong> {analysis.timeComplexity}</p>
                      <p><strong>Space Complexity:</strong> {analysis.spaceComplexity}</p>
                      <p><strong>Feedback:</strong> {analysis.feedback}</p>
                      
                      {analysis.optimizations && analysis.optimizations.length > 0 && (
                        <>
                          <p className="mt-1"><strong>Optimizations:</strong></p>
                          <ul className="list-disc list-inside">
                            {analysis.optimizations.map((opt: string, idx: number) => (
                              <li key={idx}>{opt}</li>
                            ))}
                          </ul>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Control buttons */}
            <div className="border-t p-3 flex justify-between items-center bg-white">
              <div className="flex items-center">
                <Button 
                  onClick={runCode}
                  disabled={isRunning}
                  className="mr-3"
                >
                  {isRunning ? "Running..." : "Run Code"}
                </Button>
                <Button 
                  variant="outline"
                  onClick={submitSolution}
                  disabled={isRunning}
                >
                  Submit
                </Button>
              </div>
              
              {analysis && (
                <div className="text-sm text-muted-foreground flex items-center">
                  <span className="mr-4">Time: {analysis.timeComplexity}</span>
                  <span>Space: {analysis.spaceComplexity}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
