import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserStats } from "@shared/schema";

// Form schema for profile update
const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
});

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch user stats
  const { data: stats } = useQuery<UserStats>({
    queryKey: ["/api/stats"],
    enabled: !!user
  });

  // Profile update form
  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: z.infer<typeof profileSchema>) => {
      const res = await apiRequest("PATCH", `/api/user/${user?.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: z.infer<typeof profileSchema>) => {
    updateProfileMutation.mutate(data);
  };

  // Generate sample activity data for stats charts
  const generateWeeklyActivityData = () => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const activityData = days.map(day => {
      let baseValue = 0;
      if (stats) {
        // Generate consistent values based on user stats
        baseValue = (stats.learningHours + stats.problemsSolved) % 5 + 1;
      }
      
      return {
        day: day.substring(0, 3),
        hours: baseValue + Math.floor(Math.random() * 3),
      };
    });
    return activityData;
  };

  const generateCodingProgressData = () => {
    const categories = ["Arrays", "Strings", "Trees", "Graphs", "DP", "Sorting"];
    const progressData = categories.map(category => {
      let baseValue = 0;
      if (stats) {
        // Generate consistent values based on user stats
        baseValue = stats.problemsSolved % 10 + 5;
      }
      
      return {
        category,
        solved: baseValue + Math.floor(Math.random() * 5),
        total: 20,
      };
    });
    return progressData;
  };

  const weeklyActivity = generateWeeklyActivityData();
  const codingProgress = generateCodingProgressData();

  // Get user initials for avatar
  const initials = user?.name
    ? user.name
        .split(' ')
        .map(part => part[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)
    : "";

  return (
    <div className="flex h-screen overflow-hidden bg-muted">
      <Sidebar className="z-50" />
      
      <div className="flex-1 flex flex-col overflow-hidden md:ml-64">
        <Header onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)} />
        
        <main className="flex-1 overflow-y-auto py-6 px-4 md:px-6">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-1">My Profile</h1>
            <p className="text-muted-foreground">Manage your account and view your learning progress</p>
          </div>
          
          <Tabs defaultValue="profile">
            <TabsList className="mb-6">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="stats">Learning Statistics</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>
            
            {/* Profile Tab */}
            <TabsContent value="profile">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* User Profile Card */}
                <Card className="md:col-span-1">
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>Your personal information</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center">
                    <div className="w-24 h-24 rounded-full bg-primary text-primary-foreground flex items-center justify-center mb-4 text-2xl font-bold">
                      {initials}
                    </div>
                    <h2 className="text-xl font-semibold mb-1">{user?.name}</h2>
                    <p className="text-muted-foreground mb-2">{user?.email}</p>
                    <Badge role={user?.role || "student"} />
                    <p className="text-sm text-muted-foreground mt-6">
                      Member since {new Date().toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
                
                {/* Edit Profile Form */}
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Edit Profile</CardTitle>
                    <CardDescription>Update your personal information</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Your full name" {...field} />
                              </FormControl>
                              <FormDescription>
                                This is your public display name
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input placeholder="Your email address" type="email" {...field} />
                              </FormControl>
                              <FormDescription>
                                Used for notifications and account recovery
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button 
                          type="submit" 
                          disabled={updateProfileMutation.isPending}
                        >
                          {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {/* Statistics Tab */}
            <TabsContent value="stats">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Key Stats Cards */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Learning Hours</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stats?.learningHours || 0}</div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Total hours spent learning
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Problems Solved</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stats?.problemsSolved || 0}</div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Coding challenges completed
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Tests Completed</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stats?.testsCompleted || 0}</div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Assessments and quizzes finished
                    </p>
                  </CardContent>
                </Card>
                
                {/* Coding Progress Chart */}
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Coding Progress by Category</CardTitle>
                    <CardDescription>Problems solved in each category</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={codingProgress}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="category" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="solved" fill="hsl(var(--primary))" name="Problems Solved" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Recent Achievements */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Achievements</CardTitle>
                    <CardDescription>Badges and milestones</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-primary"
                          >
                            <circle cx="12" cy="8" r="6" />
                            <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium">First Week Streak</p>
                          <p className="text-xs text-muted-foreground">
                            Completed 7 consecutive days of learning
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-primary"
                          >
                            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium">Algorithm Master</p>
                          <p className="text-xs text-muted-foreground">
                            Solved 10 algorithm challenges
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {/* Activity Tab */}
            <TabsContent value="activity">
              <div className="grid grid-cols-1 gap-6">
                {/* Weekly Activity Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Weekly Activity</CardTitle>
                    <CardDescription>Hours spent learning per day</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={weeklyActivity}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="day" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="hours" fill="hsl(var(--primary))" name="Hours" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Recent Activity Log */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Your latest platform interactions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="border-l-2 border-primary pl-4 pb-4">
                        <p className="text-sm text-muted-foreground">Today</p>
                        <div className="mt-2 space-y-3">
                          <div>
                            <p className="font-medium">Completed a coding exercise</p>
                            <p className="text-sm text-muted-foreground">
                              "Two Sum" problem - Medium difficulty
                            </p>
                          </div>
                          <div>
                            <p className="font-medium">Generated a note</p>
                            <p className="text-sm text-muted-foreground">
                              "Heap Data Structure" note created
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border-l-2 border-primary/50 pl-4">
                        <p className="text-sm text-muted-foreground">Yesterday</p>
                        <div className="mt-2 space-y-3">
                          <div>
                            <p className="font-medium">Scheduled a mock interview</p>
                            <p className="text-sm text-muted-foreground">
                              Data Structures & Algorithms interview - Medium difficulty
                            </p>
                          </div>
                          <div>
                            <p className="font-medium">Watched a lecture</p>
                            <p className="text-sm text-muted-foreground">
                              "Advanced Data Structures" - 45 minutes
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}

// Badge component for user role
function Badge({ role }: { role: string }) {
  const getBadgeColor = () => {
    switch (role) {
      case "admin":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "teacher":
        return "bg-secondary/10 text-secondary border-secondary/20";
      default:
        return "bg-primary/10 text-primary border-primary/20";
    }
  };
  
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getBadgeColor()} capitalize`}>
      {role}
    </span>
  );
}
