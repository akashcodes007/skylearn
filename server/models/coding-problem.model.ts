import { CodingProblem, InsertCodingProblem } from '@shared/schema';
import { storage } from '../storage';

/**
 * Coding Problem Model
 * 
 * Provides methods for working with coding problems
 */
export class CodingProblemModel {
  /**
   * Get a coding problem by ID
   */
  static async getById(id: number): Promise<CodingProblem | undefined> {
    return storage.getCodingProblem(id);
  }

  /**
   * Get all coding problems
   */
  static async getAll(): Promise<CodingProblem[]> {
    return storage.getCodingProblems();
  }

  /**
   * Create a new coding problem
   */
  static async create(problemData: InsertCodingProblem): Promise<CodingProblem> {
    return storage.createCodingProblem(problemData);
  }

  /**
   * Get coding problems filtered by difficulty
   */
  static async getByDifficulty(difficulty: string): Promise<CodingProblem[]> {
    const problems = await this.getAll();
    return problems.filter(problem => problem.difficulty === difficulty);
  }

  /**
   * Get coding problems filtered by tags
   */
  static async getByTags(tags: string[]): Promise<CodingProblem[]> {
    const problems = await this.getAll();
    return problems.filter(problem => {
      if (!problem.tags) return false;
      return tags.some(tag => problem.tags?.includes(tag));
    });
  }
}