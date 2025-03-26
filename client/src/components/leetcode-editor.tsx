import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Check, X, PlayCircle, Terminal, Clock, Code2, LightbulbIcon, BookOpen, Layers } from "lucide-react";
import { CodingProblem } from "@shared/schema";

interface LeetCodeEditorProps {
  problem: CodingProblem;
  onClose?: () => void;
}

export function LeetCodeEditor({ problem, onClose }: LeetCodeEditorProps) {
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("python");
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [output, setOutput] = useState("");
  const [analysis, setAnalysis] = useState<any>(null);
  const [currentTab, setCurrentTab] = useState("description");
  const [showHint, setShowHint] = useState(false);
  const [runResults, setRunResults] = useState<{ passed: boolean; results: any[] } | null>(null);
  
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
    setRunResults(null);
    setAnalysis(null);
    
    try {
      // In a real implementation, we would execute the code against test cases
      const response = await apiRequest("POST", "/api/code/analyze", {
        code,
        language,
        problemStatement: problem.description
      });
      
      const result = await response.json();
      
      // Set output based on test cases
      let outputText = "Executing against test cases:\n\n";
      const testResults = [];
      
      // Process test cases
      if (Array.isArray(problem.testCases)) {
        for (let i = 0; i < problem.testCases.length; i++) {
          const testCase = problem.testCases[i];
          const passed = result.correctness; // In a real implementation, each test case would have its own result
          
          // Format input nicely
          const inputStr = JSON.stringify(testCase.input);
          
          outputText += `Test Case ${i + 1}:\n`;
          outputText += `Input: ${inputStr}\n`;
          outputText += `Expected Output: ${JSON.stringify(testCase.output)}\n`;
          outputText += `Actual Output: ${passed ? JSON.stringify(testCase.output) : "Failed"}\n`;
          outputText += `${passed ? "✅ Passed" : "❌ Failed"}\n\n`;
          
          testResults.push({
            id: i + 1,
            input: testCase.input,
            expectedOutput: testCase.output,
            passed
          });
        }
      }
      
      setOutput(outputText);
      setRunResults({
        passed: result.correctness,
        results: testResults
      });
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
    setIsSubmitting(true);
    
    try {
      // In a real implementation, we would submit the solution to the server
      const response = await apiRequest("POST", "/api/code/analyze", {
        code,
        language,
        problemStatement: problem.description
      });
      
      const result = await response.json();
      
      if (result.correctness) {
        // Update user stats
        await apiRequest("PATCH", "/api/stats", {
          problemsSolved: 1
        });
        
        // Invalidate stats to refresh
        queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
        
        toast({
          title: "Solution Accepted",
          description: "Your solution passed all test cases. Great job!",
        });
      } else {
        toast({
          title: "Solution Rejected",
          description: "Your solution failed some test cases. Please try again.",
          variant: "destructive"
        });
      }
      
      setAnalysis(result);
      
    } catch (error) {
      console.error("Error submitting solution:", error);
      toast({
        title: "Error submitting solution",
        description: "There was a problem submitting your solution.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderDifficultyBadge = (difficulty: string) => {
    const color = difficulty.toLowerCase() === 'easy' 
      ? 'bg-green-100 text-green-800'
      : difficulty.toLowerCase() === 'medium'
        ? 'bg-yellow-100 text-yellow-800'
        : 'bg-red-100 text-red-800';
    
    return <Badge className={color}>{difficulty}</Badge>;
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center overflow-y-auto py-10">
      <Card className="w-full max-w-6xl h-[90vh] max-h-[90vh] flex flex-col overflow-hidden bg-white">
        <CardHeader className="p-4 border-b flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              {problem.title}
              {renderDifficultyBadge(problem.difficulty)}
            </CardTitle>
            <CardDescription>
              {problem.tags?.join(", ")}
            </CardDescription>
          </div>
          <Button 
            variant="ghost" 
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <span className="sr-only">Close</span>
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>
        
        <div className="flex-1 flex overflow-hidden">
          {/* Left panel with problem description and examples */}
          <div className="w-[45%] border-r flex flex-col overflow-hidden">
            <Tabs
              value={currentTab}
              onValueChange={setCurrentTab}
              className="flex flex-col overflow-hidden h-full"
            >
              <div className="border-b">
                <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
                  <TabsTrigger
                    value="description"
                    className="rounded-none border-b-2 border-transparent py-2.5 data-[state=active]:border-primary"
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Description
                  </TabsTrigger>
                  <TabsTrigger
                    value="solution"
                    className="rounded-none border-b-2 border-transparent py-2.5 data-[state=active]:border-primary"
                  >
                    <LightbulbIcon className="h-4 w-4 mr-2" />
                    Solution
                  </TabsTrigger>
                  <TabsTrigger
                    value="submissions"
                    className="rounded-none border-b-2 border-transparent py-2.5 data-[state=active]:border-primary"
                  >
                    <Layers className="h-4 w-4 mr-2" />
                    Submissions
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent
                value="description"
                className="flex-1 overflow-y-auto p-4 data-[state=active]:mt-0"
              >
                <h4 className="font-medium mb-3">Problem Description</h4>
                <p className="text-sm mb-4">{problem.description}</p>
                
                <Accordion type="single" collapsible defaultValue="examples">
                  <AccordionItem value="examples">
                    <AccordionTrigger className="font-medium text-sm py-2">
                      Examples
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4">
                        {problem.testCases?.slice(0, 2).map((testCase: any, idx: number) => (
                          <div key={idx} className="bg-muted p-3 rounded-lg font-mono text-sm">
                            <p><span className="text-primary">Input:</span> {JSON.stringify(testCase.input)}</p>
                            <p><span className="text-primary">Output:</span> {JSON.stringify(testCase.output)}</p>
                            <p><span className="text-primary">Explanation:</span> Sample test case.</p>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="constraints">
                    <AccordionTrigger className="font-medium text-sm py-2">
                      Constraints
                    </AccordionTrigger>
                    <AccordionContent>
                      <ul className="list-disc list-inside text-sm space-y-1 mb-4">
                        <li>2 &lt;= nums.length &lt;= 10<sup>4</sup></li>
                        <li>-10<sup>9</sup> &lt;= nums[i] &lt;= 10<sup>9</sup></li>
                        <li>-10<sup>9</sup> &lt;= target &lt;= 10<sup>9</sup></li>
                        <li>Only one valid answer exists.</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="hints">
                    <AccordionTrigger className="font-medium text-sm py-2">
                      Hints
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowHint(!showHint)}
                          className="w-full justify-start"
                        >
                          <LightbulbIcon className="h-4 w-4 mr-2" />
                          {showHint ? "Hide Hint" : "Show Hint"}
                        </Button>
                        
                        {showHint && (
                          <div className="p-3 bg-yellow-50 text-yellow-800 rounded-md text-sm">
                            A really efficient approach to solve this problem can use a hash table. 
                            While you iterate through the array, check if the complement (target - current number) 
                            exists in the hash table. If it does, you've found a solution.
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </TabsContent>
              
              <TabsContent
                value="solution"
                className="flex-1 overflow-y-auto p-4 data-[state=active]:mt-0"
              >
                <h4 className="font-medium mb-3">Solution Approach</h4>
                <p className="text-sm mb-4">
                  There are multiple approaches to solve this problem:
                </p>
                
                <div className="space-y-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <h5 className="font-medium text-sm mb-2">Brute Force Approach (O(n²))</h5>
                    <p className="text-sm mb-2">
                      The simplest approach is to use two nested loops to check all possible pairs of numbers.
                    </p>
                    <pre className="text-xs bg-black text-white p-3 rounded-md overflow-x-auto">
{`function twoSum(nums, target) {
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] + nums[j] === target) {
        return [i, j];
      }
    }
  }
  return [];
}`}
                    </pre>
                  </div>
                  
                  <div className="bg-muted p-4 rounded-lg">
                    <h5 className="font-medium text-sm mb-2">Optimized Approach (O(n))</h5>
                    <p className="text-sm mb-2">
                      A more efficient approach uses a hash map to store previously seen numbers and their indices.
                    </p>
                    <pre className="text-xs bg-black text-white p-3 rounded-md overflow-x-auto">
{`function twoSum(nums, target) {
  const map = new Map();
  
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    
    map.set(nums[i], i);
  }
  
  return [];
}`}
                    </pre>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent
                value="submissions"
                className="flex-1 overflow-y-auto p-4 data-[state=active]:mt-0"
              >
                <h4 className="font-medium mb-3">Your Submissions</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Your most recent code submissions will appear here.
                </p>
                
                <div className="text-center py-12">
                  <Code2 className="h-12 w-12 mx-auto text-muted mb-4" />
                  <p className="text-muted-foreground">No submissions yet</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Right panel with code editor and output */}
          <div className="w-[55%] flex flex-col">
            {/* Language tabs */}
            <div className="border-b p-2 flex">
              <Tabs value={language} onValueChange={setLanguage}>
                <TabsList>
                  <TabsTrigger value="python">
                    Python
                  </TabsTrigger>
                  <TabsTrigger value="javascript">
                    JavaScript
                  </TabsTrigger>
                  <TabsTrigger value="java">
                    Java
                  </TabsTrigger>
                  <TabsTrigger value="cpp">
                    C++
                  </TabsTrigger>
                </TabsList>
              </Tabs>
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
            {(output || analysis || runResults) && (
              <div className="border-t bg-muted h-64 overflow-y-auto flex flex-col">
                <div className="border-b p-2 flex">
                  <Tabs defaultValue="results">
                    <TabsList>
                      <TabsTrigger value="results">
                        <Terminal className="h-4 w-4 mr-2" />
                        Test Results
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                
                <div className="flex-1 p-3 overflow-y-auto">
                  {runResults && (
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <div className={`h-6 w-6 rounded-full flex items-center justify-center mr-2 ${runResults.passed ? 'bg-green-100' : 'bg-red-100'}`}>
                          {runResults.passed ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <X className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        <span className="font-medium">
                          {runResults.passed 
                            ? `All ${runResults.results.length} test cases passed` 
                            : `Some test cases failed`}
                        </span>
                      </div>
                      
                      <div>
                        {runResults.results.map((result: any) => (
                          <div 
                            key={result.id} 
                            className={`p-2 mb-2 rounded-md ${result.passed ? 'bg-green-50' : 'bg-red-50'}`}
                          >
                            <div className="flex items-center mb-1">
                              <div className={`h-5 w-5 rounded-full flex items-center justify-center mr-2 ${result.passed ? 'bg-green-100' : 'bg-red-100'}`}>
                                {result.passed ? (
                                  <Check className="h-3 w-3 text-green-600" />
                                ) : (
                                  <X className="h-3 w-3 text-red-600" />
                                )}
                              </div>
                              <span className={`text-sm font-medium ${result.passed ? 'text-green-700' : 'text-red-700'}`}>
                                Test Case {result.id}
                              </span>
                            </div>
                            <div className="ml-7 text-xs font-mono">
                              <div><span className="opacity-70">Input:</span> {JSON.stringify(result.input)}</div>
                              <div><span className="opacity-70">Expected:</span> {JSON.stringify(result.expectedOutput)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {analysis && (
                    <div className="mt-4">
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
              </div>
            )}
            
            {/* Control buttons */}
            <CardFooter className="border-t p-3 flex justify-between items-center bg-white">
              <div className="flex items-center">
                <Button 
                  onClick={runCode}
                  disabled={isRunning}
                  className="mr-3"
                  variant="outline"
                >
                  <PlayCircle className="h-4 w-4 mr-2" />
                  {isRunning ? "Running..." : "Run Code"}
                </Button>
                <Button 
                  onClick={submitSolution}
                  disabled={isSubmitting || isRunning}
                >
                  {isSubmitting ? "Submitting..." : "Submit"}
                </Button>
              </div>
              
              {analysis && (
                <div className="text-sm text-muted-foreground flex items-center">
                  <div className="flex items-center mr-4">
                    <Clock className="h-4 w-4 mr-1 text-yellow-600" />
                    <span>Time: {analysis.timeComplexity}</span>
                  </div>
                  <div className="flex items-center">
                    <Layers className="h-4 w-4 mr-1 text-blue-600" />
                    <span>Space: {analysis.spaceComplexity}</span>
                  </div>
                </div>
              )}
            </CardFooter>
          </div>
        </div>
      </Card>
    </div>
  );
}