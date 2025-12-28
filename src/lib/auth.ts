import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';

/**
 * Retrieves the JWT secret from environment variables.
 * Throws an error if the secret is not configured.
 * 
 * @returns The JWT secret string
 * @throws Error if JWT_SECRET environment variable is not set
 */
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      'JWT_SECRET environment variable is not set. ' +
      'Please set a secure secret in your .env file. ' +
      'You can generate one using: openssl rand -base64 32'
    );
  }
  return secret;
}

const JWT_SECRET: string = getJwtSecret();

/**
 * JWT payload structure containing user authentication information
 */
export interface JwtPayload {
  /** Unique user identifier */
  userId: string;
  /** User's email address */
  email: string;
  /** User's role (e.g., 'admin', 'user', 'enterprise') */
  role: string;
  /** Optional enterprise ID for enterprise users */
  enterpriseId?: string;
}

/**
 * Hashes a plain text password using bcrypt.
 * 
 * @param password - The plain text password to hash
 * @returns A promise that resolves to the hashed password
 * @example
 * const hashedPassword = await hashPassword('mySecurePassword');
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Compares a plain text password with a hashed password.
 * 
 * @param password - The plain text password to verify
 * @param hash - The hashed password to compare against
 * @returns A promise that resolves to true if passwords match, false otherwise
 * @example
 * const isValid = await comparePassword('myPassword', hashedPassword);
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generates a JWT token from the given payload.
 * Token expires in 7 days.
 * 
 * @param payload - The JWT payload containing user information
 * @returns The signed JWT token string
 * @example
 * const token = generateToken({ userId: '123', email: 'user@example.com', role: 'user' });
 */
export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload as object, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Verifies and decodes a JWT token.
 * 
 * @param token - The JWT token to verify
 * @returns The decoded payload if valid, null if invalid or expired
 * @example
 * const payload = verifyToken(token);
 * if (payload) {
 *   console.log('User ID:', payload.userId);
 * }
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Extracts the JWT token from the Authorization header of a request.
 * Expects the header format: "Bearer <token>"
 * 
 * @param request - The Next.js request object
 * @returns The token string if present, null otherwise
 */
export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

/**
 * Extracts and verifies the user from a request's Authorization header.
 * Combines getTokenFromRequest and verifyToken for convenience.
 * 
 * @param request - The Next.js request object
 * @returns The decoded JWT payload if valid, null otherwise
 * @example
 * const user = getUserFromRequest(request);
 * if (user) {
 *   console.log('Authenticated user:', user.email);
 * }
 */
export function getUserFromRequest(request: NextRequest): JwtPayload | null {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  return verifyToken(token);
}
