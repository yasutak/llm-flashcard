import { MiddlewareHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { ZodError } from 'zod';

export const errorHandler = (): MiddlewareHandler => {
  return async (c, next) => {
    try {
      await next();
    } catch (error) {
      // Handle Zod validation errors
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message,
          code: err.code
        }));
        
        console.error('Validation error:', formattedErrors);
        
        return c.json(
          {
            status: 400,
            message: 'Validation Error',
            errors: formattedErrors
          },
          400
        );
      }
      
      // Handle HTTP exceptions
      if (error instanceof HTTPException) {
        return error.getResponse();
      }

      console.error('Unhandled error:', error);
      
      return c.json(
        {
          status: 500,
          message: 'Internal Server Error',
        },
        500
      );
    }
  };
};
