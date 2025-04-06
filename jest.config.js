module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/docs/**',
    '!src/seeders/**',
    '!**/node_modules/**'
  ],
  coverageReporters: ['text', 'lcov'],
  testTimeout: 10000
};