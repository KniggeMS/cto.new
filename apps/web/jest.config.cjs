const baseConfig = require('@infocus/jest-config/react');

module.exports = {
  ...baseConfig,
  displayName: 'web',
  rootDir: __dirname,
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/src/**/*.test.tsx', '<rootDir>/src/**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
};
