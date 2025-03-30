import { Request, Response } from 'express';
import { TestService } from '../services/test.service';
import { TestModel } from '../models/test.model';
import { insertTestSchema } from '@shared/schema';
import { ZodError } from 'zod';

/**
 * Test Controller
 * 
 * Handles test-related routes
 */
export class TestController {
  /**
   * Get all tests
   */
  static async getAllTests(req: Request, res: Response) {
    try {
      // Get upcoming tests by default
      const upcoming = req.query.upcoming === 'true';
      
      let tests;
      if (upcoming) {
        tests = await TestModel.getUpcoming();
      } else {
        tests = await TestModel.getAll();
      }
      
      res.json(tests);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to get tests", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }

  /**
   * Get a test by ID
   */
  static async getTest(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid test ID" });
      }
      
      const test = await TestModel.getById(id);
      
      if (!test) {
        return res.status(404).json({ message: "Test not found" });
      }
      
      res.json(test);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to get test", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }

  /**
   * Create a new test
   */
  static async createTest(req: Request, res: Response) {
    try {
      // Ensure we have a user
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Only allow admin or teacher to create tests
      if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Validate request body
      const testData = insertTestSchema.parse(req.body);
      
      // Create test
      const test = await TestModel.create(testData);
      
      res.status(201).json(test);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Invalid test data", 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ 
        message: "Failed to create test", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }

  /**
   * Update a test
   */
  static async updateTest(req: Request, res: Response) {
    try {
      // Ensure we have a user
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Only allow admin or teacher to update tests
      if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid test ID" });
      }
      
      // Check if test exists
      const existingTest = await TestModel.getById(id);
      
      if (!existingTest) {
        return res.status(404).json({ message: "Test not found" });
      }
      
      // Update test
      const updatedTest = await TestModel.update(id, req.body);
      
      res.json(updatedTest);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to update test", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }

  /**
   * Generate MCQ questions
   */
  static async generateMCQQuestions(req: Request, res: Response) {
    try {
      // Ensure we have a user
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Only allow admin or teacher to generate questions
      if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const { topic, count } = req.body;
      
      if (!topic || !count) {
        return res.status(400).json({ message: "Topic and count are required" });
      }
      
      // Generate questions
      const questions = await TestService.generateMCQQuestions(topic, parseInt(count));
      
      res.json(questions);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to generate MCQ questions", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }

  /**
   * Submit a coding test
   */
  static async submitCodingTest(req: Request, res: Response) {
    try {
      // Ensure we have a user
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const testId = parseInt(req.params.id);
      const { submissions } = req.body;
      
      if (isNaN(testId)) {
        return res.status(400).json({ message: "Invalid test ID" });
      }
      
      if (!submissions || !Array.isArray(submissions)) {
        return res.status(400).json({ message: "Submissions array is required" });
      }
      
      // Submit test
      const result = await TestService.submitCodingTest(
        req.user.id,
        testId,
        submissions
      );
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to submit coding test", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }

  /**
   * Submit an MCQ test
   */
  static async submitMCQTest(req: Request, res: Response) {
    try {
      // Ensure we have a user
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const testId = parseInt(req.params.id);
      const { answers } = req.body;
      
      if (isNaN(testId)) {
        return res.status(400).json({ message: "Invalid test ID" });
      }
      
      if (!answers || !Array.isArray(answers)) {
        return res.status(400).json({ message: "Answers array is required" });
      }
      
      // Submit test
      const result = await TestService.submitMCQTest(
        req.user.id,
        testId,
        answers
      );
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to submit MCQ test", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }
}