const baseConfig = require('@infocus/jest-config/react');
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  ...baseConfig,
  displayName: 'web',
  rootDir: __dirname,
  roots: ['<rootDir>/src'],
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/src/**/*.test.tsx', '<rootDir>/src/**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    ...baseConfig.moduleNameMapper,
  },
};

module.exports = createJestConfig(customJestConfig);
