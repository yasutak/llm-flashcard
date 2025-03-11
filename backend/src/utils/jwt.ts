import { SignJWT, jwtVerify } from 'jose';

// Generate a JWT token
export async function generateJWT(
  payload: Record<string, any>,
  secret: string,
  expiresIn: string = '24h'
): Promise<string> {
  const secretKey = new TextEncoder().encode(secret);
  const expirationTime = getExpirationTime(expiresIn);

  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expirationTime)
    .setSubject(payload.userId)
    .sign(secretKey);
}

// Verify a JWT token
export async function verifyJWT(token: string, secret: string): Promise<any> {
  const secretKey = new TextEncoder().encode(secret);
  
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

// Helper function to calculate expiration time
function getExpirationTime(expiresIn: string): number {
  const now = Math.floor(Date.now() / 1000); // Current time in seconds
  
  if (expiresIn.endsWith('s')) {
    return now + parseInt(expiresIn.slice(0, -1));
  } else if (expiresIn.endsWith('m')) {
    return now + parseInt(expiresIn.slice(0, -1)) * 60;
  } else if (expiresIn.endsWith('h')) {
    return now + parseInt(expiresIn.slice(0, -1)) * 60 * 60;
  } else if (expiresIn.endsWith('d')) {
    return now + parseInt(expiresIn.slice(0, -1)) * 60 * 60 * 24;
  } else {
    // Default to 24 hours if format is not recognized
    return now + 24 * 60 * 60;
  }
}
