export default {
    testEnvironment: 'node',
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/**/*.test.js',
    ],
    testMatch: [
        '**/tests/**/*.test.js',
    ],
    verbose: true,
    testTimeout: 10000,
    transformIgnorePatterns: [],
};
