/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

const {readdirSync} = require('fs');
const {join} = require('path');

const rulesDirPlugin = require('eslint-plugin-rulesdir');

rulesDirPlugin.RULES_DIR = 'tools/eslint/lib';

function getThirdPartyPackages() {
  return readdirSync(join(__dirname, 'packages/puppeteer-core/third_party'), {
    withFileTypes: true,
  })
    .filter(dirent => {
      return dirent.isDirectory();
    })
    .map(({name}) => {
      return {
        name,
        message: `Import \`${name}\` from the vendored location: third_party/${name}/index.js`,
      };
    });
}

module.exports = {
  root: true,
  env: {
    node: true,
    es6: true,
  },

  parser: '@typescript-eslint/parser',

  plugins: ['mocha', '@typescript-eslint', 'import', 'rulesdir'],

  extends: ['plugin:prettier/recommended', 'plugin:import/typescript'],

  settings: {
    'import/resolver': {
      typescript: true,
    },
  },

  rules: {
    'no-implicit-globals': ['error'],
  },
  overrides: [
    {
      files: ['*.ts'],
      parserOptions: {
        allowAutomaticSingleRunInference: true,
        project: './tsconfig.base.json',
      },
      extends: [
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/stylistic',
      ],
      plugins: ['eslint-plugin-tsdoc'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',

        '@typescript-eslint/prefer-ts-expect-error': 'error',
        // This is more performant; see https://v8.dev/blog/fast-async.
        '@typescript-eslint/return-await': ['error', 'always'],
        // This optimizes the dependency tracking for type-only files.
        '@typescript-eslint/consistent-type-imports': 'error',
        // So type-only exports get elided.
        '@typescript-eslint/consistent-type-exports': 'error',
        // Don't want to trigger unintended side-effects.
        '@typescript-eslint/no-import-type-side-effects': 'error',
      },
      overrides: [
        {
          files: 'packages/puppeteer-core/src/**/*.ts',
          rules: {
            'no-restricted-imports': [
              'error',
              {
                patterns: ['*Events', '*.test.js'],
                paths: [...getThirdPartyPackages()],
              },
            ],
          },
        },
      ],
    },

    {
      // Applies to only published packages
      files: ['packages/**/*.ts'],
      rules: {
        // Error if comments do not adhere to `tsdoc`.
        'tsdoc/syntax': 'error',
      },
    },
  ],
};
