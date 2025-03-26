import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  ArrowRight, 
  ArrowUp, 
  BookOpen, 
  Clock, 
  Code 
} from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { CourseCard } from "@/components/course-card";
import { NoteCard } from "@/components/note-card";
import { UpcomingCard } from "@/components/upcoming-card";
import { useAuth } from "@/hooks/use-auth";
import { Course, Enrollment, Note, Test, Interview } from "@shared/schema";

export default function Dashboard() {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch user stats
  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
    enabled: !!user
  });

  // Fetch user enrollments (courses)
  const { data: enrollments } = useQuery<(Enrollment & { course: Course })[]>({
    queryKey: ["/api/enrollments"],
    enabled: !!user
  });

  // Fetch user's notes
  const { data: notes } = useQuery<Note[]>({
    queryKey: ["/api/notes"],
    enabled: !!user
  });

  // Fetch upcoming interviews
  const { data: upcomingInterviews } = useQuery<Interview[]>({
    queryKey: ["/api/interviews/upcoming"],
    enabled: !!user
  });

  // Fetch upcoming tests
  const { data: upcomingTests } = useQuery<Test[]>({
    queryKey: ["/api/tests/upcoming"],
    enabled: !!user
  });

  // Format upcoming interviews for the component
  const formattedInterviews = upcomingInterviews?.map(interview => ({
    id: interview.id,
    title: interview.type,
    description: interview.notes || `${interview.difficulty} level interview`,
    isAi: interview.isAi,
    scheduledAt: interview.scheduledAt,
    type: 'interview' as const
  })) || [];

  // Format upcoming tests for the component
  const formattedTests = upcomingTests?.map(test => ({
    id: test.id,
    title: test.title,
    description: test.description,
    testType: test.type === 'MCQ' ? 'MCQ' as const : 'Coding' as const,
    durationMinutes: test.durationMinutes,
    scheduledAt: test.scheduledAt || new Date(),
    type: 'test' as const
  })) || [];

  return (
    <div className="flex h-screen overflow-hidden bg-muted">
      <Sidebar className="z-50" />
      
      <div className="flex-1 flex flex-col overflow-hidden md:ml-64">
        <Header onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)} />
        
        <main className="flex-1 overflow-y-auto py-6 px-4 md:px-6">
          {/* Dashboard Welcome Section */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-1">Welcome back, {user?.name}! 👋</h1>
            <p className="text-muted-foreground">Continue your learning journey from where you left off.</p>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-white rounded-xl shadow-sm p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm mb-1">Learning Hours</p>
                    <h3 className="text-3xl font-bold">{stats?.learningHours || 0}</h3>
                    <p className="text-success text-xs mt-1 flex items-center">
                      <ArrowUp className="h-3 w-3 mr-1" /> 12% from last week
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Clock className="h-5 w-5" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm mb-1">Coding Problems</p>
                    <h3 className="text-3xl font-bold">{stats?.problemsSolved || 0}/100</h3>
                    <p className="text-success text-xs mt-1 flex items-center">
                      <ArrowUp className="h-3 w-3 mr-1" /> 5 solved this week
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Code className="h-5 w-5" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm mb-1">Course Progress</p>
                    <h3 className="text-3xl font-bold">
                      {enrollments && enrollments.length > 0 
                        ? Math.round(enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length)
                        : 0}%
                    </h3>
                    <p className="text-muted-foreground text-xs mt-1 flex items-center">
                      {enrollments?.length || 0} courses in progress
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <BookOpen className="h-5 w-5" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Continue Learning Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Continue Learning</h2>
              <Link href="/courses" className="text-sm text-primary hover:underline flex items-center">
                View all courses <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrollments && enrollments.length > 0 ? (
                enrollments.slice(0, 3).map((enrollment) => (
                  <CourseCard
                    key={enrollment.id}
                    id={enrollment.courseId}
                    title={enrollment.course.title}
                    description={enrollment.course.description}
                    level={enrollment.course.level}
                    durationHours={enrollment.course.durationHours}
                    instructorName="Instructor" // Would fetch instructor name in real implementation
                    progress={enrollment.progress}
                    coverImage={enrollment.course.coverImage}
                  />
                ))
              ) : (
                <div className="col-span-3 py-10 text-center bg-white rounded-xl shadow-sm">
                  <h3 className="text-lg font-medium mb-2">No courses enrolled yet</h3>
                  <p className="text-muted-foreground mb-4">Enroll in courses to start your learning journey</p>
                  <Link href="/courses">
                    <button className="bg-primary text-white px-4 py-2 rounded-lg">
                      Browse Courses
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Notes Section */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Recent AI-Generated Notes</h2>
                <Link href="/notes" className="text-sm text-primary hover:underline flex items-center">
                  View all notes <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
              
              <div className="space-y-4">
                {notes && notes.length > 0 ? (
                  notes.slice(0, 2).map((note) => (
                    <NoteCard
                      key={note.id}
                      title={note.title}
                      content={note.content}
                      createdAt={note.createdAt}
                      tags={note.tags || []}
                    />
                  ))
                ) : (
                  <div className="py-10 text-center bg-white rounded-xl shadow-sm">
                    <h3 className="text-lg font-medium mb-2">No notes generated yet</h3>
                    <p className="text-muted-foreground mb-4">Generate AI notes to enhance your learning</p>
                    <Link href="/notes">
                      <button className="bg-primary text-white px-4 py-2 rounded-lg">
                        Create Notes
                      </button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
            
            {/* Upcoming Section */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Coming Up</h2>
                <Link href="/calendar" className="text-sm text-primary hover:underline flex items-center">
                  Full calendar <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
              
              {/* Upcoming Interviews */}
              <UpcomingCard
                title="Interviews"
                heading="Upcoming Interviews"
                items={formattedInterviews}
                viewAllLink="/interviews"
                onScheduleNew={() => window.location.href = "/interviews"}
              />
              
              {/* Upcoming Tests */}
              <UpcomingCard
                title="Tests"
                heading="Upcoming Tests"
                items={formattedTests}
                viewAllLink="/tests"
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
