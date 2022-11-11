/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/configuration
 */

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  testMatch: ['<rootDir>/tests/**/?(*.)+(e2e).[tj]s?(x)'],
  preset: 'ts-jest',
  testEnvironment: 'node',
};
