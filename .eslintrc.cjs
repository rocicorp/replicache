module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  rules: {
    '@typescript-eslint/naming-convention': [
      'error',
      {
        selector: 'memberLike',
        modifiers: ['public'],
        format: ['camelCase'],
        leadingUnderscore: 'forbid',
      },
    ],
    'object-shorthand': 'error',
    'no-var': 'error',
  },
};
