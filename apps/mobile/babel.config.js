module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    '@babel/preset-typescript',
    '@babel/preset-react',
  ],
  plugins: [
    // Critically important: strip Flow types from React Native code
    // This is the key to resolving the jest-expo/React Native compatibility issue
    '@babel/plugin-transform-flow-strip-types',
  ],
};
