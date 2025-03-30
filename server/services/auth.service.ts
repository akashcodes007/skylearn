import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { InsertUser, User } from '@shared/schema';
import { UserModel } from '../models/user.model';

const scryptAsync = promisify(scrypt);

/**
 * Authentication Service
 * 
 * Provides methods for user authentication
 */
export class AuthService {
  /**
   * Register a new user
   */
  static async registerUser(userData: InsertUser): Promise<User> {
    // Check if user already exists
    const existingUser = await UserModel.getByUsername(userData.username);
    if (existingUser) {
      throw new Error('Username already exists');
    }

    // Hash password
    const hashedPassword = await this.hashPassword(userData.password);

    // Create user with hashed password
    return UserModel.create({
      ...userData,
      password: hashedPassword
    });
  }

  /**
   * Authenticate a user
   */
  static async authenticateUser(username: string, password: string): Promise<User | null> {
    // Get user by username
    const user = await UserModel.getByUsername(username);
    if (!user) {
      return null;
    }

    // Verify password
    const passwordValid = await this.comparePasswords(password, user.password);
    if (!passwordValid) {
      return null;
    }

    return user;
  }

  /**
   * Hash a password
   */
  static async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString('hex')}.${salt}`;
  }

  /**
   * Compare passwords
   */
  static async comparePasswords(supplied: string, stored: string): Promise<boolean> {
    const [hashed, salt] = stored.split('.');
    const hashedBuf = Buffer.from(hashed, 'hex');
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  }
}