import { MiddlewareHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';

export const errorHandler = (): MiddlewareHandler => {
  return async (c, next) => {
    try {
      await next();
    } catch (error) {
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
