module.exports = {
  collectCoverage: true,
  moduleFileExtensions: [
    'js',
    'jsx',
    'json',
  ],
  transformIgnorePatterns: [
    '/node_modules/*'
  ],
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  testMatch: [
    '**/tests/unit/**/*.spec.(js|jsx|ts|tsx)|**/__tests__/*.(js|jsx|ts|tsx)'
  ],
  testURL: 'http://localhost/',
}
