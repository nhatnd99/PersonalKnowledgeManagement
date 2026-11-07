module.exports = {
  root: true,
  env: { node: true, es2022: true, jest: true },
  extends: ['eslint:recommended'],
  ignorePatterns: ['node_modules/', 'tests/', '.eslintrc.cjs'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  rules: {
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-console': 'off',
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-template': 'error',
  },
};
