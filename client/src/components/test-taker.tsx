import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Test } from "@shared/schema";
import { Clock, CheckCircle, XCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface TestTakerProps {
  test: Test;
  onClose: () => void;
  onComplete: (score: number, totalQuestions: number) => void;
}

export function TestTaker({ test, onClose, onComplete }: TestTakerProps) {
  const { toast } = useToast();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [timeRemaining, setTimeRemaining] = useState(test.durationMinutes * 60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTestCompleted, setIsTestCompleted] = useState(false);
  const [testResult, setTestResult] = useState<{
    score: number;
    incorrectQuestions: number[];
    correctQuestions: number[];
  } | null>(null);

  // Format time remaining as mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const progressPercentage = 
    (Object.keys(selectedAnswers).length / (test.questions as any[]).length) * 100;

  // Setup timer countdown
  useEffect(() => {
    if (isTestCompleted) return;
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isTestCompleted]);

  // Handle answer selection
  const handleSelectAnswer = (questionIndex: number, answerIndex: number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: answerIndex
    }));
  };

  // Navigate to next question
  const handleNextQuestion = () => {
    if (currentQuestionIndex < (test.questions as any[]).length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  // Navigate to previous question
  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  // Submit the test
  const handleSubmitTest = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      // In a real app, we would submit answers to the server
      // For now, we'll calculate the score locally
      
      const questions = test.questions as any[];
      let score = 0;
      const incorrectQuestions: number[] = [];
      const correctQuestions: number[] = [];
      
      questions.forEach((question, index) => {
        const selectedAnswer = selectedAnswers[index];
        if (selectedAnswer === question.correctIndex || selectedAnswer === question.answer) {
          score++;
          correctQuestions.push(index);
        } else {
          incorrectQuestions.push(index);
        }
      });
      
      // Set results
      setTestResult({
        score,
        incorrectQuestions,
        correctQuestions
      });
      
      setIsTestCompleted(true);
      onComplete(score, questions.length);
      
      // Update user stats
      await apiRequest("PATCH", "/api/stats", {
        testsCompleted: 1
      });
      
      // Invalidate stats to refresh
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      
    } catch (error) {
      console.error("Error submitting test:", error);
      toast({
        title: "Error submitting test",
        description: "There was a problem submitting your test.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle test confirmation dialog
  const handleConfirmSubmit = () => {
    const questionsCount = (test.questions as any[]).length;
    const answeredCount = Object.keys(selectedAnswers).length;
    
    if (answeredCount < questionsCount) {
      if (!confirm(`You've only answered ${answeredCount} out of ${questionsCount} questions. Are you sure you want to submit?`)) {
        return;
      }
    }
    
    handleSubmitTest();
  };

  // Render current question
  const renderQuestion = () => {
    const questions = test.questions as any[];
    const currentQuestion = questions[currentQuestionIndex];
    
    if (!currentQuestion) return null;
    
    // For MCQ tests
    if (test.type === "MCQ") {
      return (
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-4">
            {currentQuestionIndex + 1}. {currentQuestion.question}
          </h3>
          
          <RadioGroup 
            value={selectedAnswers[currentQuestionIndex]?.toString()}
            onValueChange={(value) => handleSelectAnswer(currentQuestionIndex, parseInt(value))}
            className="space-y-3"
          >
            {currentQuestion.options.map((option: string, idx: number) => (
              <div key={idx} className="flex items-center space-x-2">
                <RadioGroupItem value={idx.toString()} id={`option-${idx}`} />
                <Label htmlFor={`option-${idx}`} className="cursor-pointer">{option}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      );
    }
    
    // For coding tests, we would render a code editor
    // This is simplified for now
    return (
      <div className="mb-8">
        <h3 className="text-lg font-medium mb-4">
          {currentQuestionIndex + 1}. {currentQuestion.question}
        </h3>
        
        <div className="bg-muted p-4 rounded-md mb-4">
          <p className="text-sm font-mono">Implement your solution here...</p>
        </div>
      </div>
    );
  };

  // Render test results
  const renderTestResults = () => {
    if (!testResult) return null;
    
    const questions = test.questions as any[];
    const percentage = Math.round((testResult.score / questions.length) * 100);
    
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Test Completed</h2>
          <p className="text-muted-foreground mb-4">Here are your results</p>
          
          <div className="mb-6">
            <div className="text-5xl font-bold mb-2">{percentage}%</div>
            <p className="text-lg">
              You scored {testResult.score} out of {questions.length} questions
            </p>
          </div>
          
          <div className="flex justify-center gap-8 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {testResult.correctQuestions.length}
              </div>
              <p className="text-sm text-muted-foreground">Correct</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600 mb-1">
                {testResult.incorrectQuestions.length}
              </div>
              <p className="text-sm text-muted-foreground">Incorrect</p>
            </div>
          </div>
        </div>
        
        <Separator />
        
        <div>
          <h3 className="font-medium mb-4">Question Summary</h3>
          <div className="space-y-3">
            {questions.map((question, idx) => (
              <div key={idx} className="flex items-center gap-3">
                {testResult.correctQuestions.includes(idx) ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <span className="text-sm truncate">
                  {idx + 1}. {question.question.substring(0, 50)}
                  {question.question.length > 50 ? "..." : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center overflow-y-auto py-10">
      <Card className="w-full max-w-3xl max-h-screen flex flex-col overflow-hidden bg-white">
        <CardHeader className="p-4 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-xl">{test.title}</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={test.type === "MCQ" ? "default" : "secondary"}>
                {test.type}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {(test.questions as any[]).length} questions
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <span className={timeRemaining < 60 ? "text-red-600 font-bold" : ""}>
              {formatTime(timeRemaining)}
            </span>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-y-auto p-6">
          {isTestCompleted ? (
            renderTestResults()
          ) : (
            <>
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span>Progress</span>
                  <span>{Object.keys(selectedAnswers).length} / {(test.questions as any[]).length} questions answered</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>
              
              {renderQuestion()}
              
              <div className="flex items-center justify-between mt-6">
                <Button
                  variant="outline"
                  onClick={handlePrevQuestion}
                  disabled={currentQuestionIndex === 0}
                >
                  Previous
                </Button>
                
                <div className="text-sm text-muted-foreground">
                  Question {currentQuestionIndex + 1} of {(test.questions as any[]).length}
                </div>
                
                <Button
                  onClick={handleNextQuestion}
                  disabled={currentQuestionIndex === (test.questions as any[]).length - 1}
                >
                  Next
                </Button>
              </div>
            </>
          )}
        </CardContent>
        
        {!isTestCompleted && (
          <CardFooter className="border-t p-4 flex justify-between">
            <Button variant="outline" onClick={onClose}>Exit</Button>
            <Button onClick={handleConfirmSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Test"}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}