import { Request, Response, NextFunction } from 'express';

/**
 * Logging Middleware
 * 
 * Middleware for request logging
 */
export class LoggingMiddleware {
  /**
   * Logs API requests with timing information
   */
  static logRequests(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    
    // Log request
    console.log(`${req.method} ${req.url} [STARTED]`);
    
    // Add a listener for when the response is finished
    res.on('finish', () => {
      // Calculate processing time
      const duration = Date.now() - start;
      
      // Log response
      console.log(`${req.method} ${req.url} [${res.statusCode}] - ${duration}ms`);
    });
    
    next();
  }

  /**
   * Logs errors
   */
  static logErrors(err: any, req: Request, res: Response, next: NextFunction) {
    console.error('Error:', err);
    next(err);
  }
}