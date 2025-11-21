const baseConfig = require('@infocus/jest-config/node');

module.exports = {
  ...baseConfig,
  displayName: 'api',
  rootDir: __dirname,
  testMatch: ['<rootDir>/src/**/*.test.ts'],
};
