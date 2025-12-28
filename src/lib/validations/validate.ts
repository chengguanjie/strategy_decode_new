/**
 * Validation utility functions
 * 
 * Provides helper functions for validating request data using Zod schemas.
 */

import { NextResponse } from 'next/server';
import { ZodError, ZodSchema } from 'zod';

/**
 * Validation result type
 */
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: NextResponse };

/**
 * Validate request body against a Zod schema
 * 
 * @param body - The request body to validate
 * @param schema - The Zod schema to validate against
 * @returns Validation result with either parsed data or error response
 * 
 * @example
 * const result = validateBody(body, loginSchema);
 * if (!result.success) {
 *   return result.error;
 * }
 * const { email, password } = result.data;
 */
export function validateBody<T>(
  body: unknown,
  schema: ZodSchema<T>
): ValidationResult<T> {
  try {
    const data = schema.parse(body);
    return { success: true, data };
  } catch (error) {
    if (error instanceof ZodError) {
      const errorMessages = error.issues.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));

      return {
        success: false,
        error: NextResponse.json(
          {
            success: false,
            error: {
              code: 'VAL_001',
              message: '请求参数验证失败',
              details: errorMessages,
            },
          },
          { status: 400 }
        ),
      };
    }

    return {
      success: false,
      error: NextResponse.json(
        {
          success: false,
          error: {
            code: 'VAL_002',
            message: '请求参数格式错误',
          },
        },
        { status: 400 }
      ),
    };
  }
}

/**
 * Validate query parameters against a Zod schema
 * 
 * @param searchParams - URLSearchParams from the request
 * @param schema - The Zod schema to validate against
 * @returns Validation result with either parsed data or error response
 */
export function validateQuery<T>(
  searchParams: URLSearchParams,
  schema: ZodSchema<T>
): ValidationResult<T> {
  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });

  return validateBody(params, schema);
}

/**
 * Safe parse without throwing - returns null on failure
 * 
 * @param body - The data to validate
 * @param schema - The Zod schema to validate against
 * @returns Parsed data or null if validation fails
 */
export function safeParse<T>(body: unknown, schema: ZodSchema<T>): T | null {
  const result = schema.safeParse(body);
  return result.success ? result.data : null;
}

/**
 * Format Zod errors into a user-friendly message
 */
export function formatZodErrors(error: ZodError): string {
  return error.issues
    .map((e) => {
      const field = e.path.join('.');
      return field ? `${field}: ${e.message}` : e.message;
    })
    .join('; ');
}
