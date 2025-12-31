import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: ['node_modules/**', 'dist/**', '*.config.js'],
  },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
    rules: {
      'no-unused-vars': ['warn', { 
        argsIgnorePattern: '^(_|reply|request|options)$',
        varsIgnorePattern: '^_',
        args: 'after-used',
      }],
      'no-console': 'off', // Allow console for logging
    },
  },
];

