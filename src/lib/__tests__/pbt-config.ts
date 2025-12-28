/**
 * Property-Based Testing Configuration
 * 
 * This file provides configuration and utilities for property-based testing
 * using fast-check library.
 * 
 * **Validates: Requirements 7.1**
 * 
 * Feature: project-diagnosis-improvement
 */

import fc from 'fast-check';

/**
 * Default configuration for property-based tests
 * - numRuns: 100 iterations per property test (minimum recommended)
 * - verbose: Show details on failure
 * - seed: Optional seed for reproducibility
 */
export const defaultPbtConfig: fc.Parameters<unknown> = {
  numRuns: 100,
  verbose: fc.VerbosityLevel.VeryVerbose,
  // Uncomment to set a fixed seed for reproducibility
  // seed: 12345,
};

/**
 * Extended configuration for more thorough testing
 */
export const extendedPbtConfig: fc.Parameters<unknown> = {
  numRuns: 500,
  verbose: fc.VerbosityLevel.VeryVerbose,
};

/**
 * Quick configuration for development/debugging
 */
export const quickPbtConfig: fc.Parameters<unknown> = {
  numRuns: 10,
  verbose: fc.VerbosityLevel.VeryVerbose,
};

/**
 * Common arbitraries for the application
 */
export const arbitraries = {
  /**
   * Generate valid email addresses
   */
  validEmail: fc.constantFrom(
    'test@example.com',
    'user@domain.org',
    'admin@company.net',
    'info@test.io',
    'support@service.co',
    'contact@business.com',
    'hello@startup.io',
    'team@enterprise.org',
  ),

  /**
   * Generate valid passwords (min 6 characters)
   */
  validPassword: fc.string({ minLength: 6, maxLength: 100 })
    .filter(s => s.trim().length >= 6),

  /**
   * Generate valid user names
   */
  validName: fc.string({ minLength: 1, maxLength: 100 })
    .filter(s => s.trim().length > 0),

  /**
   * Generate valid user roles
   */
  userRole: fc.constantFrom(
    'PLATFORM_ADMIN',
    'ENTERPRISE_ADMIN',
    'MANAGER',
    'EMPLOYEE',
  ),

  /**
   * Generate valid JWT payload roles
   */
  jwtRole: fc.constantFrom(
    'admin',
    'enterprise_admin',
    'department_manager',
    'employee',
  ),

  /**
   * Generate valid UUIDs
   */
  uuid: fc.uuid(),

  /**
   * Generate HTTP methods
   */
  httpMethod: fc.constantFrom('GET', 'POST', 'PUT', 'DELETE', 'PATCH'),

  /**
   * Generate invalid tokens for testing
   */
  invalidToken: fc.oneof(
    fc.constant(''),
    fc.constant('invalid-token'),
    fc.constant('Bearer'),
    fc.constant('abc123def456'),
    fc.string({ minLength: 1, maxLength: 100 }).filter(s => !s.includes('.')),
  ),

  /**
   * Generate table types for strategy tables
   */
  tableType: fc.constantFrom(
    'financial',
    'market',
    'value',
    'process',
    'team',
    'review',
  ),

  /**
   * Generate dashboard card status
   */
  cardStatus: fc.constantFrom('success', 'warning', 'danger'),

  /**
   * Generate progress values (0-100)
   */
  progress: fc.integer({ min: 0, max: 100 }),

  /**
   * Generate invalid progress values
   */
  invalidProgress: fc.oneof(
    fc.integer({ min: -1000, max: -1 }),
    fc.integer({ min: 101, max: 1000 }),
  ),
};

/**
 * Helper function to run property tests with default configuration
 */
export async function runProperty<T>(
  arbitrary: fc.Arbitrary<T>,
  predicate: (value: T) => boolean | Promise<boolean>,
  config: fc.Parameters<T> = defaultPbtConfig as fc.Parameters<T>,
): Promise<void> {
  await fc.assert(
    fc.asyncProperty(arbitrary, predicate),
    config,
  );
}

/**
 * Helper to create a JWT payload arbitrary
 */
export const jwtPayloadArbitrary = fc.record({
  userId: fc.uuid(),
  email: arbitraries.validEmail,
  role: arbitraries.jwtRole,
  enterpriseId: fc.option(fc.uuid(), { nil: undefined }),
});

/**
 * Helper to create a user creation payload arbitrary
 */
export const userCreationArbitrary = fc.record({
  name: arbitraries.validName,
  email: arbitraries.validEmail,
  password: arbitraries.validPassword,
  role: fc.option(arbitraries.userRole, { nil: undefined }),
});

/**
 * Helper to create a department arbitrary
 */
export const departmentArbitrary = fc.record({
  name: fc.string({ minLength: 1, maxLength: 100 }),
  leader: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
});

/**
 * Helper to create a strategy arbitrary
 */
export const strategyArbitrary = fc.record({
  title: fc.string({ minLength: 1, maxLength: 200 }),
  moduleType: fc.string({ minLength: 1 }),
  description: fc.option(fc.string({ maxLength: 1000 }), { nil: undefined }),
});

/**
 * Helper to create a dashboard card arbitrary
 */
export const dashboardCardArbitrary = fc.record({
  name: fc.string({ minLength: 1, maxLength: 100 }),
  targetValue: fc.string({ minLength: 1 }),
  currentValue: fc.string({ minLength: 1 }),
  unit: fc.string({ minLength: 1, maxLength: 20 }),
  progress: fc.option(arbitraries.progress, { nil: undefined }),
  status: fc.option(arbitraries.cardStatus, { nil: undefined }),
});

/**
 * Helper to create table column arbitrary
 */
export const tableColumnArbitrary = fc.record({
  key: fc.string({ minLength: 1 }),
  title: fc.string({ minLength: 1 }),
  width: fc.option(fc.integer({ min: 50, max: 500 }), { nil: undefined }),
});

/**
 * Helper to create customer structure arbitrary
 */
export const customerStructureArbitrary = fc.record({
  tableType: arbitraries.tableType,
  columns: fc.array(tableColumnArbitrary, { minLength: 1, maxLength: 10 }),
  data: fc.array(fc.object(), { minLength: 0, maxLength: 100 }),
});
