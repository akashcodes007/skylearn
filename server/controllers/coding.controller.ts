import { Request, Response } from 'express';
import { CodingProblemModel } from '../models/coding-problem.model';
import { CodeExecutionService } from '../services/code-execution.service';
import { SubmissionModel } from '../models/submission.model';
import { insertCodingProblemSchema } from '@shared/schema';
import { ZodError } from 'zod';
import { SUPPORTED_LANGUAGES } from '../services/code-execution.service';

/**
 * Coding Controller
 * 
 * Handles coding-related routes
 */
export class CodingController {
  /**
   * Get all coding problems
   */
  static async getAllProblems(req: Request, res: Response) {
    try {
      // Get query parameters for filtering
      const { difficulty, tags } = req.query;
      
      let problems;
      
      if (difficulty) {
        problems = await CodingProblemModel.getByDifficulty(difficulty as string);
      } else if (tags) {
        const tagsList = (tags as string).split(',');
        problems = await CodingProblemModel.getByTags(tagsList);
      } else {
        problems = await CodingProblemModel.getAll();
      }
      
      res.json(problems);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to get coding problems", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }

  /**
   * Get a coding problem by ID
   */
  static async getProblem(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid problem ID" });
      }
      
      const problem = await CodingProblemModel.getById(id);
      
      if (!problem) {
        return res.status(404).json({ message: "Problem not found" });
      }
      
      res.json(problem);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to get coding problem", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }

  /**
   * Create a new coding problem
   */
  static async createProblem(req: Request, res: Response) {
    try {
      // Validate request body
      const problemData = insertCodingProblemSchema.parse(req.body);
      
      // Create problem
      const problem = await CodingProblemModel.create(problemData);
      
      res.status(201).json(problem);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Invalid problem data", 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ 
        message: "Failed to create coding problem", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }

  /**
   * Execute code
   */
  static async executeCode(req: Request, res: Response) {
    try {
      const { code, language, input } = req.body;
      
      if (!code || !language) {
        return res.status(400).json({ message: "Code and language are required" });
      }
      
      // Check if language is supported
      if (!SUPPORTED_LANGUAGES.includes(language)) {
        return res.status(400).json({ message: `Unsupported language: ${language}` });
      }
      
      // Execute code
      const result = await CodeExecutionService.executeCode(code, language, input);
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to execute code", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }

  /**
   * Submit solution for a problem
   */
  static async submitSolution(req: Request, res: Response) {
    try {
      const problemId = parseInt(req.params.id);
      const { code, language } = req.body;
      
      if (isNaN(problemId)) {
        return res.status(400).json({ message: "Invalid problem ID" });
      }
      
      if (!code || !language) {
        return res.status(400).json({ message: "Code and language are required" });
      }
      
      // Check if language is supported
      if (!SUPPORTED_LANGUAGES.includes(language)) {
        return res.status(400).json({ message: `Unsupported language: ${language}` });
      }
      
      // Check if problem exists
      const problem = await CodingProblemModel.getById(problemId);
      
      if (!problem) {
        return res.status(404).json({ message: "Problem not found" });
      }

      // Ensure we have a user
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "Authentication required" });
      }

      // Create initial submission
      const submission = await SubmissionModel.create({
        userId: req.user.id,
        problemId,
        code,
        language,
        status: 'pending'
      });
      
      try {
        // Run test cases
        const testCases = typeof problem.testCases === 'string'
          ? JSON.parse(problem.testCases)
          : problem.testCases;

        const testResult = await CodeExecutionService.testCode(code, language, testCases);
        
        // Update submission with results
        const updatedSubmission = await SubmissionModel.update(
          submission.id, 
          'completed', 
          testResult
        );
        
        res.json({
          submission: updatedSubmission,
          passed: testResult.passed,
          results: testResult.results
        });
      } catch (error) {
        // Update submission with error
        await SubmissionModel.update(
          submission.id, 
          'failed', 
          { error: error instanceof Error ? error.message : String(error) }
        );
        
        throw error;
      }
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to submit solution", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }

  /**
   * Get all submissions for a user
   */
  static async getUserSubmissions(req: Request, res: Response) {
    try {
      // Ensure we have a user
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const userId = req.user.id;
      const submissions = await SubmissionModel.getByUserId(userId);
      
      res.json(submissions);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to get user submissions", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }

  /**
   * Get submissions for a specific problem
   */
  static async getProblemSubmissions(req: Request, res: Response) {
    try {
      const problemId = parseInt(req.params.id);
      
      if (isNaN(problemId)) {
        return res.status(400).json({ message: "Invalid problem ID" });
      }
      
      // Ensure we have a user
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Only allow admin or teacher to see all submissions
      if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const submissions = await SubmissionModel.getByProblemId(problemId);
      
      res.json(submissions);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to get problem submissions", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }

  /**
   * Analyze code submission using AI
   */
  static async analyzeCode(req: Request, res: Response) {
    try {
      const { code, language, problemId } = req.body;
      
      if (!code || !language) {
        return res.status(400).json({ message: "Code and language are required" });
      }
      
      let problemStatement = '';
      
      if (problemId) {
        const problem = await CodingProblemModel.getById(parseInt(problemId));
        if (problem) {
          problemStatement = problem.description;
        }
      }
      
      // Analyze code
      const analysis = await CodeExecutionService.analyzeCode(code, language, problemStatement);
      
      res.json(analysis);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to analyze code", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }
}