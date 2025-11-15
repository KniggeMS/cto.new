/**
 * Custom Babel Jest transformer for React Native
 * Handles Flow type stripping and React Native code transformations
 */
const babelJest = require('babel-jest');

// Create the transformer with configuration that strips Flow types
const transformer = babelJest.createTransformer({
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    '@babel/preset-typescript',
    ['@babel/preset-react', { runtime: 'automatic' }],
  ],
  plugins: [
    // Strip Flow types from React Native and other source code
    '@babel/plugin-transform-flow-strip-types',
  ],
  babelrc: false,
  configFile: false,
});

module.exports = transformer;
