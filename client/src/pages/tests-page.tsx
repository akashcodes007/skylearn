import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Clock, ListChecks, Code2 } from "lucide-react";
import { format } from "date-fns";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Test } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function TestsPage() {
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch tests
  const { data: tests, isLoading } = useQuery<Test[]>({
    queryKey: ["/api/tests"]
  });

  // Categorize tests
  const now = new Date();
  
  // Upcoming tests (scheduled in the future)
  const upcomingTests = tests
    ? tests.filter(test => test.scheduledAt && new Date(test.scheduledAt) > now)
        .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime())
    : [];
  
  // Available tests (no schedule or already started)
  const availableTests = tests
    ? tests.filter(test => !test.scheduledAt || new Date(test.scheduledAt) <= now)
        .sort((a, b) => a.title.localeCompare(b.title))
    : [];

  const getTestTypeIcon = (type: string) => {
    if (type === "MCQ") {
      return <ListChecks className="h-5 w-5 text-warning" />;
    } else if (type === "Coding") {
      return <Code2 className="h-5 w-5 text-accent" />;
    } else {
      return <ListChecks className="h-5 w-5 text-primary" />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-muted">
      <Sidebar className="z-50" />
      
      <div className="flex-1 flex flex-col overflow-hidden md:ml-64">
        <Header onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)} />
        
        <main className="flex-1 overflow-y-auto py-6 px-4 md:px-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <h1 className="text-2xl font-bold mb-2 sm:mb-0">Tests & Quizzes</h1>
          </div>
          
          {/* Tabs for upcoming/available tests */}
          <Tabs defaultValue="available" className="mb-6">
            <TabsList>
              <TabsTrigger value="available">
                Available Tests
                {availableTests?.length > 0 && (
                  <Badge className="ml-2 bg-primary text-primary-foreground">
                    {availableTests.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="upcoming">
                Upcoming Tests
                {upcomingTests?.length > 0 && (
                  <Badge className="ml-2 bg-muted-foreground text-muted">
                    {upcomingTests.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
            
            {/* Available Tests Tab */}
            <TabsContent value="available">
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="spinner h-8 w-8 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : availableTests.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {availableTests.map((test) => (
                    <Card key={test.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{test.title}</CardTitle>
                            <CardDescription>{test.description}</CardDescription>
                          </div>
                          <div>
                            {getTestTypeIcon(test.type)}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col space-y-3">
                          <div className="flex items-center text-sm">
                            <Badge variant={test.type === "MCQ" ? "warning" : "accent"}>
                              {test.type}
                            </Badge>
                          </div>
                          <div className="flex items-center text-sm">
                            <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span>{test.durationMinutes} minutes</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <span className="text-muted-foreground">
                              {Array.isArray(test.questions) ? test.questions.length : 0} questions
                            </span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          className="w-full" 
                          onClick={() => {
                            toast({
                              title: "Test started",
                              description: `You're now taking "${test.title}". Good luck!`
                            });
                            // In a real app, would navigate to the test taking page
                          }}
                        >
                          Start Test
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                  <h3 className="text-lg font-medium mb-2">No tests available</h3>
                  <p className="text-muted-foreground mb-4">
                    Check back later for new tests or see the upcoming tests tab
                  </p>
                </div>
              )}
            </TabsContent>
            
            {/* Upcoming Tests Tab */}
            <TabsContent value="upcoming">
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="spinner h-8 w-8 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : upcomingTests.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {upcomingTests.map((test) => (
                    <Card key={test.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{test.title}</CardTitle>
                            <CardDescription>{test.description}</CardDescription>
                          </div>
                          <div>
                            {getTestTypeIcon(test.type)}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col space-y-3">
                          <div className="flex items-center text-sm">
                            <Badge variant={test.type === "MCQ" ? "warning" : "accent"}>
                              {test.type}
                            </Badge>
                          </div>
                          <div className="flex items-center text-sm">
                            <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span>{test.scheduledAt ? format(new Date(test.scheduledAt), "EEEE, MMMM d, yyyy") : "Not scheduled"}</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span>
                              {test.scheduledAt ? format(new Date(test.scheduledAt), "h:mm a") : ""} ({test.durationMinutes} minutes)
                            </span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          className="w-full" 
                          variant="outline"
                          onClick={() => {
                            toast({
                              title: "Reminder set",
                              description: `We'll remind you when "${test.title}" is available`
                            });
                          }}
                        >
                          Set Reminder
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                  <h3 className="text-lg font-medium mb-2">No upcoming tests</h3>
                  <p className="text-muted-foreground mb-4">
                    There are no scheduled tests at the moment
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
          
          {/* Test Tips Section */}
          <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Test Taking Tips</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-warning/10 p-4 rounded-lg">
                <h3 className="font-medium mb-2 flex items-center">
                  <ListChecks className="h-5 w-5 mr-2 text-warning" />
                  Multiple Choice Tests
                </h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Read each question carefully before answering</li>
                  <li>• Eliminate obviously incorrect options first</li>
                  <li>• If unsure, mark the question and come back to it</li>
                  <li>• Review all answers before submitting</li>
                  <li>• Don't leave any questions unanswered</li>
                </ul>
              </div>
              <div className="bg-accent/10 p-4 rounded-lg">
                <h3 className="font-medium mb-2 flex items-center">
                  <Code2 className="h-5 w-5 mr-2 text-accent" />
                  Coding Tests
                </h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Read the problem statement thoroughly</li>
                  <li>• Consider edge cases in your solution</li>
                  <li>• Start with a working solution before optimizing</li>
                  <li>• Test your code with example inputs</li>
                  <li>• Comment your code to explain your approach</li>
                </ul>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
