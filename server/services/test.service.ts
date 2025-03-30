import { Test, InsertTest } from '@shared/schema';
import { TestModel } from '../models/test.model';
import { SubmissionModel } from '../models/submission.model';
import { generateMCQQuestions } from '../openai';
import { CodeExecutionService } from './code-execution.service';

/**
 * Test Service
 * 
 * Provides methods for test management and evaluation
 */
export class TestService {
  /**
   * Get a test by ID
   */
  static async getTest(id: number): Promise<Test | undefined> {
    return TestModel.getById(id);
  }

  /**
   * Get all tests
   */
  static async getAllTests(): Promise<Test[]> {
    return TestModel.getAll();
  }

  /**
   * Get upcoming tests
   */
  static async getUpcomingTests(): Promise<Test[]> {
    return TestModel.getUpcoming();
  }

  /**
   * Create a new test
   */
  static async createTest(testData: InsertTest): Promise<Test> {
    return TestModel.create(testData);
  }

  /**
   * Update a test
   */
  static async updateTest(id: number, testData: Partial<Test>): Promise<Test | undefined> {
    return TestModel.update(id, testData);
  }

  /**
   * Generate MCQ questions for a test
   */
  static async generateMCQQuestions(topic: string, count: number): Promise<any> {
    return generateMCQQuestions(topic, count);
  }

  /**
   * Submit a coding test
   */
  static async submitCodingTest(
    userId: number,
    testId: number,
    submissions: Array<{
      problemId: number;
      code: string;
      language: string;
    }>
  ): Promise<any> {
    // Get the test
    const test = await TestModel.getById(testId);
    if (!test) {
      throw new Error('Test not found');
    }

    // Parse test questions if needed
    const questions = typeof test.questions === 'string'
      ? JSON.parse(test.questions)
      : test.questions;

    // Process each submission
    const results = [];
    let totalScore = 0;
    let maxScore = 0;

    for (const submission of submissions) {
      try {
        // Find the corresponding problem in the test
        const problem = questions.find((q: any) => q.id === submission.problemId);
        if (!problem) {
          results.push({
            problemId: submission.problemId,
            passed: false,
            error: 'Problem not found in test',
            score: 0
          });
          continue;
        }

        // Increase max possible score
        maxScore += problem.points || 10;

        // Run tests for this submission
        const testResult = await CodeExecutionService.testCode(
          submission.code,
          submission.language,
          problem.testCases
        );

        // Calculate score based on passed tests
        const passedCount = testResult.results.filter(r => r.passed).length;
        const totalTests = testResult.results.length;
        const problemScore = problem.points || 10;
        const earnedScore = Math.round((passedCount / totalTests) * problemScore);

        // Add to total score
        totalScore += earnedScore;

        // Save submission
        await SubmissionModel.create({
          userId,
          testId,
          problemId: submission.problemId,
          code: submission.code,
          language: submission.language,
          status: 'completed',
          results: testResult
        });

        // Add to results
        results.push({
          problemId: submission.problemId,
          passed: testResult.passed,
          results: testResult.results,
          score: earnedScore,
          maxScore: problemScore
        });
      } catch (error) {
        // Log submission error
        await SubmissionModel.create({
          userId,
          testId,
          problemId: submission.problemId,
          code: submission.code,
          language: submission.language,
          status: 'failed',
          results: { error: error instanceof Error ? error.message : String(error) }
        });

        // Add failed result
        results.push({
          problemId: submission.problemId,
          passed: false,
          error: error instanceof Error ? error.message : String(error),
          score: 0
        });
      }
    }

    // Create the final test result
    return {
      testId,
      userId,
      completed: true,
      score: totalScore,
      maxScore,
      results
    };
  }

  /**
   * Submit MCQ test answers
   */
  static async submitMCQTest(
    userId: number,
    testId: number,
    answers: Array<{ questionId: number; answerId: number }>
  ): Promise<any> {
    // Get the test
    const test = await TestModel.getById(testId);
    if (!test) {
      throw new Error('Test not found');
    }

    // Parse test questions if needed
    const questions = typeof test.questions === 'string'
      ? JSON.parse(test.questions)
      : test.questions;

    // Evaluate answers
    let totalScore = 0;
    const maxScore = questions.length * 10; // Assuming 10 points per question
    const results = [];

    for (const answer of answers) {
      // Find the corresponding question
      const question = questions.find((q: any) => q.id === answer.questionId);
      
      if (!question) {
        results.push({
          questionId: answer.questionId,
          correct: false,
          message: 'Question not found'
        });
        continue;
      }

      // Check if answer is correct
      const correct = question.correctAnswerId === answer.answerId;
      
      // Add points if correct
      if (correct) {
        totalScore += 10; // 10 points per correct answer
      }

      // Add to results
      results.push({
        questionId: answer.questionId,
        correct,
        correctAnswerId: question.correctAnswerId,
        selectedAnswerId: answer.answerId
      });
    }

    // Calculate percentage score
    const percentageScore = Math.round((totalScore / maxScore) * 100);

    // Return test result
    return {
      testId,
      userId,
      completed: true,
      score: totalScore,
      maxScore,
      percentageScore,
      results
    };
  }
}