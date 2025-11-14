const baseConfig = require('./base');

module.exports = {
  ...baseConfig,
  plugins: [...baseConfig.plugins, 'react', 'react-hooks'],
  extends: [...baseConfig.extends, 'plugin:react/recommended', 'plugin:react-hooks/recommended'],
  parserOptions: {
    ...baseConfig.parserOptions,
    ecmaFeatures: {
      jsx: true,
    },
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  env: {
    ...baseConfig.env,
    browser: true,
  },
  rules: {
    ...baseConfig.rules,
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
  },
};
