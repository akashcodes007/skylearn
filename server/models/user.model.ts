import { User, InsertUser } from '@shared/schema';
import { storage } from '../storage';

/**
 * User Model
 * 
 * Provides methods for working with user data
 */
export class UserModel {
  /**
   * Get a user by ID
   */
  static async getById(id: number): Promise<User | undefined> {
    return storage.getUser(id);
  }

  /**
   * Get a user by username
   */
  static async getByUsername(username: string): Promise<User | undefined> {
    return storage.getUserByUsername(username);
  }

  /**
   * Get a user by email
   */
  static async getByEmail(email: string): Promise<User | undefined> {
    return storage.getUserByEmail(email);
  }

  /**
   * Create a new user
   */
  static async create(userData: InsertUser): Promise<User> {
    return storage.createUser(userData);
  }

  /**
   * Update a user
   */
  static async update(id: number, userData: Partial<User>): Promise<User | undefined> {
    return storage.updateUser(id, userData);
  }
}