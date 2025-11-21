const baseConfig = require('@infocus/jest-config/react-native');

module.exports = {
  ...baseConfig,
  displayName: 'mobile',
  rootDir: __dirname,
  testMatch: ['<rootDir>/src/**/*.test.tsx', '<rootDir>/src/**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
};
