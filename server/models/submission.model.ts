import { storage } from '../storage';

export type SubmissionStatus = 'pending' | 'completed' | 'failed';

export interface Submission {
  id: number;
  userId: number;
  problemId?: number;
  testId?: number;
  code: string;
  language: string;
  status: SubmissionStatus;
  results?: any;
  createdAt: Date;
}

export interface InsertSubmission {
  userId: number;
  problemId?: number;
  testId?: number;
  code: string;
  language: string;
  status: SubmissionStatus;
  results?: any;
}

/**
 * Submission Model
 * 
 * Provides methods for working with code submissions
 */
export class SubmissionModel {
  private static submissions: Map<number, Submission> = new Map();
  private static submissionIdCounter: number = 1;

  /**
   * Create a new submission
   */
  static async create(submissionData: InsertSubmission): Promise<Submission> {
    const id = this.submissionIdCounter++;
    
    const submission: Submission = {
      id,
      ...submissionData,
      createdAt: new Date()
    };
    
    this.submissions.set(id, submission);
    return submission;
  }

  /**
   * Get a submission by ID
   */
  static async getById(id: number): Promise<Submission | undefined> {
    return this.submissions.get(id);
  }

  /**
   * Get all submissions for a user
   */
  static async getByUserId(userId: number): Promise<Submission[]> {
    return Array.from(this.submissions.values())
      .filter(submission => submission.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get all submissions for a specific coding problem
   */
  static async getByProblemId(problemId: number): Promise<Submission[]> {
    return Array.from(this.submissions.values())
      .filter(submission => submission.problemId === problemId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get all submissions for a specific test
   */
  static async getByTestId(testId: number): Promise<Submission[]> {
    return Array.from(this.submissions.values())
      .filter(submission => submission.testId === testId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Update a submission's status and results
   */
  static async update(id: number, status: SubmissionStatus, results?: any): Promise<Submission | undefined> {
    const submission = this.submissions.get(id);
    
    if (!submission) {
      return undefined;
    }
    
    const updatedSubmission = {
      ...submission,
      status,
      results: results || submission.results
    };
    
    this.submissions.set(id, updatedSubmission);
    return updatedSubmission;
  }
}