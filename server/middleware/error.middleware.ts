import { Request, Response, NextFunction } from 'express';

/**
 * Error Handling Middleware
 * 
 * Middleware for global error handling
 */
export class ErrorMiddleware {
  /**
   * Global error handler
   */
  static handleErrors(err: any, req: Request, res: Response, next: NextFunction) {
    console.error('Error:', err);
    
    let statusCode = 500;
    let message = 'Internal server error';
    
    // Handle specific error types
    if (err.name === 'ValidationError') {
      statusCode = 400;
      message = err.message;
    } else if (err.name === 'UnauthorizedError') {
      statusCode = 401;
      message = 'Unauthorized';
    } else if (err.name === 'ForbiddenError') {
      statusCode = 403;
      message = 'Forbidden';
    } else if (err.name === 'NotFoundError') {
      statusCode = 404;
      message = 'Not found';
    }
    
    res.status(statusCode).json({
      error: {
        message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      }
    });
  }

  /**
   * 404 Not Found handler
   */
  static handleNotFound(req: Request, res: Response) {
    res.status(404).json({
      error: {
        message: `Not found: ${req.method} ${req.originalUrl}`
      }
    });
  }
}