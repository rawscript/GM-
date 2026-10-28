export default [{
  files: ['**/*.js'],
  ignores: ['dist/**'],
  languageOptions: { ecmaVersion: 2023, sourceType: 'module' },
  rules: {
    'no-undef': 'error',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-restricted-imports': ['error', { patterns: ['../features/*'] }]
  }
}];
