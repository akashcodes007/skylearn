import { Test, InsertTest } from '@shared/schema';
import { storage } from '../storage';

/**
 * Test Model
 * 
 * Provides methods for working with test data
 */
export class TestModel {
  /**
   * Get a test by ID
   */
  static async getById(id: number): Promise<Test | undefined> {
    return storage.getTest(id);
  }

  /**
   * Get all tests
   */
  static async getAll(): Promise<Test[]> {
    return storage.getTests();
  }

  /**
   * Get upcoming tests
   */
  static async getUpcoming(): Promise<Test[]> {
    return storage.getUpcomingTests();
  }

  /**
   * Create a new test
   */
  static async create(testData: InsertTest): Promise<Test> {
    return storage.createTest(testData);
  }

  /**
   * Update a test
   */
  static async update(id: number, testData: Partial<Test>): Promise<Test | undefined> {
    return storage.updateTest(id, testData);
  }
}