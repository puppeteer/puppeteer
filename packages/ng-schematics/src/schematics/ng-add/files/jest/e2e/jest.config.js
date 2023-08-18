/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/configuration
 */

/** @type {import('jest').Config} */
module.exports = {
  testMatch: ['<rootDir>/build/**/?(*.)+(e2e).js?(x)'],
  testEnvironment: 'node',
};
