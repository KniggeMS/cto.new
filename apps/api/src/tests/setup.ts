// Test setup file

// Set default test environment variables
process.env.NODE_ENV = 'test';
process.env.TMDB_API_KEY = 'test-tmdb-api-key';
process.env.JWT_ACCESS_SECRET = 'test-jwt-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to ignore specific console methods during tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};

// Set timeout for async operations
jest.setTimeout(10000);