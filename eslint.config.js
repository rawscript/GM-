export default [{
  files: ['**/*.js'],
  ignores: ['dist/**'],
  languageOptions: { ecmaVersion: 2023, sourceType: 'module' },
  rules: {
    'no-undef': 'error',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-restricted-imports': ['error', { patterns: ['../features/*'] }]
  },
  languageOptions: { ecmaVersion: 2023, sourceType: 'module', globals: {
    window: 'readonly', document: 'readonly', localStorage: 'readonly', fetch: 'readonly', EventSource: 'readonly', URL: 'readonly', Blob: 'readonly', console: 'readonly', process: 'readonly'
  } }
}];
