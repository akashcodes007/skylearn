import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { 
  generateNotesFromText, 
  analyzeCodeSubmission,
  generateInterviewQuestions,
  generateMCQQuestions
} from "./openai";
import { 
  insertNoteSchema, 
  insertCodingProblemSchema, 
  insertInterviewSchema,
  insertTestSchema
} from "@shared/schema";
import { ZodError } from "zod";

// Middleware to check if user is authenticated
function ensureAuthenticated(req: Request, res: Response, next: Function) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);
  
  // API routes
  
  // User Stats
  app.get("/api/stats", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const stats = await storage.getUserStats(userId);
      
      if (!stats) {
        return res.status(404).json({ message: "User stats not found" });
      }
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user stats", error: error.message });
    }
  });
  
  // Courses
  app.get("/api/courses", ensureAuthenticated, async (req, res) => {
    try {
      const courses = await storage.getCourses();
      res.json(courses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch courses", error: error.message });
    }
  });
  
  app.get("/api/courses/:id", ensureAuthenticated, async (req, res) => {
    try {
      const course = await storage.getCourse(parseInt(req.params.id));
      
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      res.json(course);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch course", error: error.message });
    }
  });
  
  // Enrollments
  app.get("/api/enrollments", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const enrollments = await storage.getEnrollmentsByUser(userId);
      
      // Fetch course details for each enrollment
      const enrollmentsWithCourses = await Promise.all(
        enrollments.map(async (enrollment) => {
          const course = await storage.getCourse(enrollment.courseId);
          return { ...enrollment, course };
        })
      );
      
      res.json(enrollmentsWithCourses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch enrollments", error: error.message });
    }
  });
  
  app.post("/api/enrollments", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const courseId = req.body.courseId;
      
      if (!courseId) {
        return res.status(400).json({ message: "Course ID is required" });
      }
      
      // Check if course exists
      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      // Check if already enrolled
      const enrollments = await storage.getEnrollmentsByUser(userId);
      const existingEnrollment = enrollments.find(e => e.courseId === courseId);
      
      if (existingEnrollment) {
        return res.status(400).json({ message: "Already enrolled in this course" });
      }
      
      // Create enrollment
      const enrollment = await storage.createEnrollment({
        userId,
        courseId,
        progress: 0
      });
      
      res.status(201).json(enrollment);
    } catch (error) {
      res.status(500).json({ message: "Failed to create enrollment", error: error.message });
    }
  });
  
  app.patch("/api/enrollments/:id/progress", ensureAuthenticated, async (req, res) => {
    try {
      const enrollmentId = parseInt(req.params.id);
      const { progress } = req.body;
      
      if (progress === undefined || progress < 0 || progress > 100) {
        return res.status(400).json({ message: "Valid progress value (0-100) is required" });
      }
      
      // Verify enrollment belongs to user
      const enrollment = await storage.getEnrollment(enrollmentId);
      
      if (!enrollment) {
        return res.status(404).json({ message: "Enrollment not found" });
      }
      
      if (enrollment.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to update this enrollment" });
      }
      
      // Update progress
      const updatedEnrollment = await storage.updateEnrollment(enrollmentId, { progress });
      
      res.json(updatedEnrollment);
    } catch (error) {
      res.status(500).json({ message: "Failed to update progress", error: error.message });
    }
  });
  
  // Notes
  app.get("/api/notes", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const notes = await storage.getNotesByUser(userId);
      res.json(notes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notes", error: error.message });
    }
  });
  
  app.post("/api/notes", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const noteData = { ...req.body, userId };
      
      // Validate note data
      const validatedData = insertNoteSchema.parse(noteData);
      
      // Create note
      const note = await storage.createNote(validatedData);
      
      res.status(201).json(note);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid note data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create note", error: error.message });
    }
  });
  
  app.post("/api/notes/generate", ensureAuthenticated, async (req, res) => {
    try {
      const { text, format, complexity, generateQuestions } = req.body;
      
      if (!text) {
        return res.status(400).json({ message: "Text content is required" });
      }
      
      // Generate notes from text
      const generatedContent = await generateNotesFromText(text, {
        format: format || "Detailed Notes",
        complexity: complexity || "Intermediate",
        generateQuestions: generateQuestions || false
      });
      
      res.json({ content: generatedContent });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate notes", error: error.message });
    }
  });
  
  app.delete("/api/notes/:id", ensureAuthenticated, async (req, res) => {
    try {
      const noteId = parseInt(req.params.id);
      const note = await storage.getNote(noteId);
      
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }
      
      if (note.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to delete this note" });
      }
      
      await storage.deleteNote(noteId);
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete note", error: error.message });
    }
  });
  
  // Coding Problems
  app.get("/api/coding-problems", ensureAuthenticated, async (req, res) => {
    try {
      const problems = await storage.getCodingProblems();
      res.json(problems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch coding problems", error: error.message });
    }
  });
  
  app.get("/api/coding-problems/:id", ensureAuthenticated, async (req, res) => {
    try {
      const problemId = parseInt(req.params.id);
      const problem = await storage.getCodingProblem(problemId);
      
      if (!problem) {
        return res.status(404).json({ message: "Coding problem not found" });
      }
      
      res.json(problem);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch coding problem", error: error.message });
    }
  });
  
  app.post("/api/coding-problems", ensureAuthenticated, async (req, res) => {
    try {
      // Check if user is admin or teacher
      if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
        return res.status(403).json({ message: "Only admins and teachers can create coding problems" });
      }
      
      // Validate problem data
      const validatedData = insertCodingProblemSchema.parse(req.body);
      
      // Create problem
      const problem = await storage.createCodingProblem(validatedData);
      
      res.status(201).json(problem);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid problem data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create coding problem", error: error.message });
    }
  });
  
  app.post("/api/code/analyze", ensureAuthenticated, async (req, res) => {
    try {
      const { code, language, problemStatement } = req.body;
      
      if (!code || !language || !problemStatement) {
        return res.status(400).json({ message: "Code, language, and problem statement are required" });
      }
      
      // Analyze code submission
      const analysis = await analyzeCodeSubmission(code, language, problemStatement);
      
      res.json(analysis);
    } catch (error) {
      res.status(500).json({ message: "Failed to analyze code", error: error.message });
    }
  });
  
  // Interviews
  app.get("/api/interviews", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const interviews = await storage.getInterviewsByUser(userId);
      res.json(interviews);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch interviews", error: error.message });
    }
  });
  
  app.get("/api/interviews/upcoming", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const upcomingInterviews = await storage.getUpcomingInterviews(userId);
      res.json(upcomingInterviews);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch upcoming interviews", error: error.message });
    }
  });
  
  app.post("/api/interviews", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const interviewData = { ...req.body, userId };
      
      // Validate interview data
      const validatedData = insertInterviewSchema.parse(interviewData);
      
      // Create interview
      const interview = await storage.createInterview(validatedData);
      
      res.status(201).json(interview);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid interview data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to schedule interview", error: error.message });
    }
  });
  
  app.post("/api/interviews/questions", ensureAuthenticated, async (req, res) => {
    try {
      const { interviewType, difficulty } = req.body;
      
      if (!interviewType || !difficulty) {
        return res.status(400).json({ message: "Interview type and difficulty are required" });
      }
      
      // Generate interview questions
      const questions = await generateInterviewQuestions(interviewType, difficulty);
      
      res.json(questions);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate interview questions", error: error.message });
    }
  });
  
  // Tests
  app.get("/api/tests", ensureAuthenticated, async (req, res) => {
    try {
      const tests = await storage.getTests();
      res.json(tests);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tests", error: error.message });
    }
  });
  
  app.get("/api/tests/upcoming", ensureAuthenticated, async (req, res) => {
    try {
      const upcomingTests = await storage.getUpcomingTests();
      res.json(upcomingTests);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch upcoming tests", error: error.message });
    }
  });
  
  app.post("/api/tests", ensureAuthenticated, async (req, res) => {
    try {
      // Check if user is admin or teacher
      if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
        return res.status(403).json({ message: "Only admins and teachers can create tests" });
      }
      
      // Validate test data
      const validatedData = insertTestSchema.parse(req.body);
      
      // Create test
      const test = await storage.createTest(validatedData);
      
      res.status(201).json(test);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid test data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create test", error: error.message });
    }
  });
  
  app.post("/api/tests/generate-mcq", ensureAuthenticated, async (req, res) => {
    try {
      const { topic, count } = req.body;
      
      if (!topic || !count) {
        return res.status(400).json({ message: "Topic and question count are required" });
      }
      
      // Generate MCQ questions
      const questions = await generateMCQQuestions(topic, count);
      
      res.json(questions);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate MCQ questions", error: error.message });
    }
  });
  
  const httpServer = createServer(app);
  return httpServer;
}
