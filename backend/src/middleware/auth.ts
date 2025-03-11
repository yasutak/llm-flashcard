import { MiddlewareHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { verifyJWT } from '../utils/jwt';

export const authMiddleware = (): MiddlewareHandler => {
  return async (c, next) => {
    try {
      // Get the authorization header
      const authHeader = c.req.header('Authorization');
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new HTTPException(401, { message: 'Unauthorized: Missing or invalid token' });
      }
      
      // Extract the token
      const token = authHeader.split(' ')[1];
      
      if (!token) {
        throw new HTTPException(401, { message: 'Unauthorized: Missing token' });
      }
      
      try {
        // Verify the token
        const payload = await verifyJWT(token, c.env.JWT_SECRET);
        
        // Set the user ID in the context for use in handlers
        c.set('userId', payload.sub);
        
        await next();
      } catch (error) {
        throw new HTTPException(401, { message: 'Unauthorized: Invalid token' });
      }
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }
      throw new HTTPException(500, { message: 'Internal Server Error' });
    }
  };
};
