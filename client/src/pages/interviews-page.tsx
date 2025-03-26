import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarIcon, Clock, Loader2, PlusCircle, UserIcon } from "lucide-react";
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
import { MockInterviewScheduler } from "@/components/mock-interview-scheduler";
import { Interview } from "@shared/schema";

export default function InterviewsPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);

  // Fetch user's interviews
  const { data: interviews, isLoading } = useQuery<Interview[]>({
    queryKey: ["/api/interviews"]
  });

  // Separate upcoming and past interviews
  const now = new Date();
  const upcomingInterviews = interviews
    ? interviews.filter(interview => new Date(interview.scheduledAt) > now)
        .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    : [];
    
  const pastInterviews = interviews
    ? interviews.filter(interview => new Date(interview.scheduledAt) <= now)
        .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
    : [];

  return (
    <div className="flex h-screen overflow-hidden bg-muted">
      <Sidebar className="z-50" />
      
      <div className="flex-1 flex flex-col overflow-hidden md:ml-64">
        <Header onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)} />
        
        <main className="flex-1 overflow-y-auto py-6 px-4 md:px-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <h1 className="text-2xl font-bold mb-2 sm:mb-0">Mock Interviews</h1>
            <Button 
              onClick={() => setShowScheduler(true)}
              className="flex items-center"
            >
              <PlusCircle className="mr-2 h-5 w-5" />
              Schedule Interview
            </Button>
          </div>
          
          {/* Tabs for upcoming/past interviews */}
          <Tabs defaultValue="upcoming" className="mb-6">
            <TabsList>
              <TabsTrigger value="upcoming">
                Upcoming Interviews
                {upcomingInterviews.length > 0 && (
                  <Badge className="ml-2 bg-primary text-primary-foreground">
                    {upcomingInterviews.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="past">
                Past Interviews
                {pastInterviews.length > 0 && (
                  <Badge className="ml-2 bg-muted-foreground text-muted">
                    {pastInterviews.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
            
            {/* Upcoming Interviews Tab */}
            <TabsContent value="upcoming">
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : upcomingInterviews.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {upcomingInterviews.map((interview) => (
                    <Card key={interview.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-lg">{interview.type}</CardTitle>
                          <Badge 
                            variant={interview.isAi ? "default" : "secondary"}
                          >
                            {interview.isAi ? "AI Interviewer" : "Human Expert"}
                          </Badge>
                        </div>
                        <CardDescription>
                          {interview.difficulty} level interview
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col space-y-3">
                          <div className="flex items-center text-sm">
                            <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span>{format(new Date(interview.scheduledAt), "EEEE, MMMM d, yyyy")}</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span>{format(new Date(interview.scheduledAt), "h:mm a")}</span>
                          </div>
                          {interview.notes && (
                            <div className="mt-4 text-sm">
                              <p className="font-medium">Special requests:</p>
                              <p className="text-muted-foreground">{interview.notes}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button className="w-full" disabled={new Date(interview.scheduledAt) > now}>
                          Join Interview
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                  <h3 className="text-lg font-medium mb-2">No upcoming interviews</h3>
                  <p className="text-muted-foreground mb-4">
                    Schedule a mock interview to practice for your next job application
                  </p>
                  <Button onClick={() => setShowScheduler(true)}>
                    Schedule Now
                  </Button>
                </div>
              )}
            </TabsContent>
            
            {/* Past Interviews Tab */}
            <TabsContent value="past">
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : pastInterviews.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pastInterviews.map((interview) => (
                    <Card key={interview.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-lg">{interview.type}</CardTitle>
                          <Badge 
                            variant={interview.isAi ? "default" : "secondary"}
                            className="opacity-70"
                          >
                            {interview.isAi ? "AI Interviewer" : "Human Expert"}
                          </Badge>
                        </div>
                        <CardDescription>
                          {interview.difficulty} level interview
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col space-y-3">
                          <div className="flex items-center text-sm">
                            <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span>{format(new Date(interview.scheduledAt), "EEEE, MMMM d, yyyy")}</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span>{format(new Date(interview.scheduledAt), "h:mm a")}</span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button variant="outline" className="w-full">
                          View Feedback
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                  <h3 className="text-lg font-medium mb-2">No past interviews</h3>
                  <p className="text-muted-foreground mb-4">
                    Your completed interviews will appear here
                  </p>
                  <Button variant="outline" onClick={() => setShowScheduler(true)}>
                    Schedule Your First Interview
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
          
          {/* Interview Tips Section */}
          <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Interview Preparation Tips</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-primary/5 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Technical Interview</h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Review data structures and algorithms</li>
                  <li>• Practice explaining your thought process</li>
                  <li>• Prepare examples of past projects</li>
                  <li>• Brush up on system design principles</li>
                </ul>
              </div>
              <div className="bg-primary/5 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Behavioral Interview</h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Use the STAR method for responses</li>
                  <li>• Prepare stories about challenges</li>
                  <li>• Practice discussing teamwork</li>
                  <li>• Research company culture</li>
                </ul>
              </div>
              <div className="bg-primary/5 p-4 rounded-lg">
                <h3 className="font-medium mb-2">General Tips</h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Test your equipment before the interview</li>
                  <li>• Dress professionally</li>
                  <li>• Prepare thoughtful questions</li>
                  <li>• Follow up with a thank-you note</li>
                </ul>
              </div>
            </div>
          </div>
        </main>
      </div>
      
      {/* Interview Scheduler Modal */}
      {showScheduler && (
        <MockInterviewScheduler
          onClose={() => setShowScheduler(false)}
        />
      )}
    </div>
  );
}
