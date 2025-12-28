describe('Simple Test', () => {
  it('should pass', () => {
    expect(1 + 1).toBe(2);
  });

  it('should have environment variables from jest.setup.js', () => {
    expect(process.env.JWT_SECRET).toBe('test-jwt-secret-for-testing-only');
    expect(process.env.NODE_ENV).toBe('test');
  });
});