import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { log } from './vite';
import { 
  AuthController, 
  CodingController, 
  TestController 
} from './controllers';
import { 
  AuthMiddleware, 
  ErrorMiddleware, 
  LoggingMiddleware 
} from './middleware';
import { setupAuth } from './auth';
import { storage } from "./storage";
import { 
  generateNotesFromText, 
  generateInterviewQuestions
} from "./openai";
import { 
  insertNoteSchema, 
  insertInterviewSchema
} from "@shared/schema";
import { ZodError } from "zod";

// Note: We'll use non-null assertions (!) for req.user after authentication middleware
// This is safe because the AuthMiddleware.ensureAuthenticated guarantees user exists

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply global middleware
  app.use(LoggingMiddleware.logRequests);
  
  // Set up authentication
  setupAuth(app);
  
  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });
  
  // User Stats
  app.get("/api/stats", AuthMiddleware.ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const stats = await storage.getUserStats(userId);
      
      if (!stats) {
        return res.status(404).json({ message: "User stats not found" });
      }
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to fetch user stats", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Courses
  app.get("/api/courses", AuthMiddleware.ensureAuthenticated, async (req, res) => {
    try {
      const courses = await storage.getCourses();
      res.json(courses);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to fetch courses", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  app.get("/api/courses/:id", AuthMiddleware.ensureAuthenticated, async (req, res) => {
    try {
      const course = await storage.getCourse(parseInt(req.params.id));
      
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      res.json(course);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to fetch course", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Enrollments
  app.get("/api/enrollments", AuthMiddleware.ensureAuthenticated, async (req, res) => {
    try {
      // req.user is guaranteed to exist after ensureAuthenticated middleware
      const userId = req.user!.id;
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
      res.status(500).json({ 
        message: "Failed to fetch enrollments", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  app.post("/api/enrollments", AuthMiddleware.ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
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
      res.status(500).json({ 
        message: "Failed to create enrollment", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Notes
  app.get("/api/notes", AuthMiddleware.ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const notes = await storage.getNotesByUser(userId);
      res.json(notes);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to fetch notes", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  app.post("/api/notes", AuthMiddleware.ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
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
      res.status(500).json({ 
        message: "Failed to create note", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  app.post("/api/notes/generate", AuthMiddleware.ensureAuthenticated, async (req, res) => {
    try {
      const { text, format, style, focusAreas } = req.body;
      
      if (!text) {
        return res.status(400).json({ message: "Text content is required" });
      }
      
      // Generate notes from text
      const generatedContent = await generateNotesFromText(text, {
        format,
        style,
        focusAreas
      });
      
      res.json(generatedContent);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Check for specific error types
      if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
        return res.status(429).json({ 
          message: "OpenAI API rate limit exceeded", 
          error: errorMessage 
        });
      }
      
      if (errorMessage.includes('quota exceeded') || errorMessage.includes('insufficient_quota')) {
        return res.status(402).json({ 
          message: "OpenAI API quota exceeded. Please check your billing details.", 
          error: errorMessage 
        });
      }
      
      // Default error response
      res.status(500).json({ 
        message: "Failed to generate notes", 
        error: errorMessage
      });
    }
  });
  
  app.delete("/api/notes/:id", AuthMiddleware.ensureAuthenticated, async (req, res) => {
    try {
      const noteId = parseInt(req.params.id);
      const note = await storage.getNote(noteId);
      
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }
      
      if (note.userId !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to delete this note" });
      }
      
      await storage.deleteNote(noteId);
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to delete note", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Interviews
  app.get("/api/interviews", AuthMiddleware.ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const interviews = await storage.getInterviewsByUser(userId);
      res.json(interviews);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to fetch interviews", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  app.get("/api/interviews/upcoming", AuthMiddleware.ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const upcomingInterviews = await storage.getUpcomingInterviews(userId);
      res.json(upcomingInterviews);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to fetch upcoming interviews", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  app.post("/api/interviews", AuthMiddleware.ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
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
      res.status(500).json({ 
        message: "Failed to schedule interview", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  app.post("/api/interviews/questions", AuthMiddleware.ensureAuthenticated, async (req, res) => {
    try {
      const { topic, difficulty, count } = req.body;
      
      if (!topic || !difficulty) {
        return res.status(400).json({ message: "Topic and difficulty are required" });
      }
      
      // Generate interview questions
      const questions = await generateInterviewQuestions(topic, difficulty, count);
      
      res.json(questions);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Check for specific error types
      if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
        return res.status(429).json({ 
          message: "OpenAI API rate limit exceeded", 
          error: errorMessage 
        });
      }
      
      if (errorMessage.includes('quota exceeded') || errorMessage.includes('insufficient_quota')) {
        return res.status(402).json({ 
          message: "OpenAI API quota exceeded. Please check your billing details.", 
          error: errorMessage 
        });
      }
      
      // Default error response
      res.status(500).json({ 
        message: "Failed to generate interview questions", 
        error: errorMessage
      });
    }
  });

  // Coding Problem routes
  app.get('/api/coding/problems', CodingController.getAllProblems);
  app.get('/api/coding/problems/:id', CodingController.getProblem);
  app.post('/api/coding/problems', AuthMiddleware.ensureTeacherOrAdmin, CodingController.createProblem);
  app.post('/api/coding/execute', AuthMiddleware.ensureAuthenticated, CodingController.executeCode);
  app.post('/api/coding/problems/:id/submit', AuthMiddleware.ensureAuthenticated, CodingController.submitSolution);
  app.get('/api/coding/submissions', AuthMiddleware.ensureAuthenticated, CodingController.getUserSubmissions);
  app.get('/api/coding/problems/:id/submissions', AuthMiddleware.ensureTeacherOrAdmin, CodingController.getProblemSubmissions);
  app.post('/api/coding/analyze', AuthMiddleware.ensureAuthenticated, CodingController.analyzeCode);

  // Test routes
  app.get('/api/tests', AuthMiddleware.ensureAuthenticated, TestController.getAllTests);
  app.get('/api/tests/:id', AuthMiddleware.ensureAuthenticated, TestController.getTest);
  app.post('/api/tests', AuthMiddleware.ensureTeacherOrAdmin, TestController.createTest);
  app.patch('/api/tests/:id', AuthMiddleware.ensureTeacherOrAdmin, TestController.updateTest);
  app.post('/api/tests/mcq/generate', AuthMiddleware.ensureTeacherOrAdmin, TestController.generateMCQQuestions);
  app.post('/api/tests/:id/submit/coding', AuthMiddleware.ensureAuthenticated, TestController.submitCodingTest);
  app.post('/api/tests/:id/submit/mcq', AuthMiddleware.ensureAuthenticated, TestController.submitMCQTest);
  
  // Remove the ErrorMiddleware.handleNotFound since it's preventing the Vite middleware from handling frontend routes
  // We'll only keep the general error handler
  app.use(ErrorMiddleware.handleErrors);
  
  const httpServer = createServer(app);
  return httpServer;
}
