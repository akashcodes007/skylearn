import { Request, Response, NextFunction } from 'express';

/**
 * Authentication Middleware
 * 
 * Middleware for protecting routes
 */
export class AuthMiddleware {
  /**
   * Ensures that a user is authenticated
   */
  static ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
    if (req.isAuthenticated() && req.user) {
      return next();
    }
    res.status(401).json({ message: "Not authenticated" });
  }

  /**
   * Ensures that a user has one of the required roles
   */
  static ensureRole(roles: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      next();
    };
  }

  /**
   * Ensures that a user is an admin
   */
  static ensureAdmin(req: Request, res: Response, next: NextFunction) {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }

    next();
  }

  /**
   * Ensures that a user is an admin or teacher
   */
  static ensureTeacherOrAdmin(req: Request, res: Response, next: NextFunction) {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
      return res.status(403).json({ message: "Teacher or admin access required" });
    }

    next();
  }

  /**
   * Ensures that the authenticated user matches the requested user ID
   */
  static ensureSameUser(req: Request, res: Response, next: NextFunction) {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const requestedUserId = parseInt(req.params.userId);
    
    if (isNaN(requestedUserId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    if (req.user.id !== requestedUserId && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    next();
  }
}