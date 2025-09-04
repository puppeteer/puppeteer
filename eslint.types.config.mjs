/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import unusedImports from 'eslint-plugin-unused-imports';
import typescriptEslint from 'typescript-eslint';

export default [
  {
    files: ['**/*.d.ts'],

    plugins: {
      'unused-imports': unusedImports,
    },

    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: typescriptEslint.parser,
    },

    rules: {
      'unused-imports/no-unused-imports': 'error',
    },
  },
];
