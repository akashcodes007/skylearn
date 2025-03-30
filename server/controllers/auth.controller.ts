import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { insertUserSchema } from '@shared/schema';
import { ZodError } from 'zod';

/**
 * Authentication Controller
 * 
 * Handles authentication-related routes
 */
export class AuthController {
  /**
   * Register a new user
   */
  static async register(req: Request, res: Response) {
    try {
      // Validate request body
      const userData = insertUserSchema.parse(req.body);
      
      // Register user
      const user = await AuthService.registerUser(userData);
      
      // Log user in
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ 
            message: "Registration successful but failed to log in", 
            error: err.message 
          });
        }
        
        // Return user without password
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Invalid user data", 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ 
        message: "Failed to register user", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }

  /**
   * Log in a user
   */
  static async login(req: Request, res: Response) {
    // This route is handled by Passport, but we'll add extra logic here
    if (!req.user) {
      return res.status(401).json({ message: "Authentication failed" });
    }
    
    // Using type assertion since we verified req.user exists
    const user = req.user as any;
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  }

  /**
   * Log out a user
   */
  static async logout(req: Request, res: Response) {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ 
          message: "Failed to log out", 
          error: err instanceof Error ? err.message : String(err) 
        });
      }
      
      res.status(200).json({ message: "Logged out successfully" });
    });
  }

  /**
   * Get the current user
   */
  static async getCurrentUser(req: Request, res: Response) {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Using type assertion since we verified req.user exists
    const user = req.user as any;
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  }
}