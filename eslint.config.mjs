/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {fixupConfigRules, fixupPluginRules} from '@eslint/compat';
import {FlatCompat} from '@eslint/eslintrc';
import js from '@eslint/js';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import _import from 'eslint-plugin-import';
import mocha from 'eslint-plugin-mocha';
import rulesdir from 'eslint-plugin-rulesdir';
import tsdoc from 'eslint-plugin-tsdoc';
import globals from 'globals';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

rulesdir.RULES_DIR = 'tools/eslint/lib';

function getThirdPartyPackages() {
  return fs
    .readdirSync(path.join(__dirname, 'packages/puppeteer-core/third_party'), {
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

/**
 * @type {import('eslint').Linter.Config[]}
 */
export default [
  {
    ignores: [
      '**/node_modules',
      '**/build/',
      '**/lib/',
      '**/bin/',
      '**/*.tsbuildinfo',
      '**/*.api.json',
      '**/*.tgz',
      '**/yarn.lock',
      '**/.docusaurus/',
      '**/.cache-loader',
      'test/output-*/',
      '**/.dev_profile*',
      '**/coverage/',
      '**/generated/',
      '**/.eslintcache',
      '**/.cache/',
      '**/.vscode',
      '!.vscode/extensions.json',
      '!.vscode/*.template.json',
      '**/.devcontainer',
      '**/.DS_Store',
      '**/.env.local',
      '**/.env.development.local',
      '**/.env.test.local',
      '**/.env.production.local',
      '**/npm-debug.log*',
      '**/yarn-debug.log*',
      '**/yarn-error.log*',
      '**/.wireit',
      '**/assets/',
      '**/third_party/',
      'packages/ng-schematics/sandbox/**/*',
      'packages/ng-schematics/multi/**/*',
      'packages/ng-schematics/src/**/files/',
      'examples/puppeteer-in-browser/out/**/*',
      'examples/puppeteer-in-browser/node_modules/**/*',
      'examples/puppeteer-in-extension/out/**/*',
      'examples/puppeteer-in-extension/node_modules/**/*',
    ],
  },
  ...fixupConfigRules(
    compat.extends('plugin:prettier/recommended', 'plugin:import/typescript')
  ),
  {
    plugins: {
      mocha,
      '@typescript-eslint': typescriptEslint,
      import: fixupPluginRules(_import),
      rulesdir,
    },

    languageOptions: {
      globals: {
        ...globals.node,
      },

      parser: tsParser,
    },

    settings: {
      'import/resolver': {
        typescript: true,
      },
    },

    rules: {
      curly: ['error', 'all'],
      'arrow-body-style': ['error', 'always'],
      'prettier/prettier': 'error',

      'spaced-comment': [
        'error',
        'always',
        {
          markers: ['*', '/'],
        },
      ],

      eqeqeq: ['error'],

      'accessor-pairs': [
        'error',
        {
          getWithoutSet: false,
          setWithoutGet: false,
        },
      ],

      'new-parens': 'error',
      'func-call-spacing': 'error',
      'prefer-const': 'error',

      'max-len': [
        'error',
        {
          code: 200,
          comments: 90,
          ignoreTemplateLiterals: true,
          ignoreUrls: true,
          ignoreStrings: true,
          ignoreRegExpLiterals: true,
        },
      ],

      'no-var': 'error',
      'no-with': 'error',
      'no-multi-str': 'error',
      'no-caller': 'error',
      'no-implied-eval': 'error',
      'no-labels': 'error',
      'no-new-object': 'error',
      'no-octal-escape': 'error',
      'no-self-compare': 'error',
      'no-shadow-restricted-names': 'error',
      'no-cond-assign': 'error',
      'no-debugger': 'error',
      'no-dupe-keys': 'error',
      'no-duplicate-case': 'error',
      'no-empty-character-class': 'error',
      'no-unreachable': 'error',
      'no-unsafe-negation': 'error',
      radix: 'error',
      'valid-typeof': 'error',

      'no-unused-vars': [
        'error',
        {
          args: 'none',
          vars: 'local',
          varsIgnorePattern:
            '([fx]?describe|[fx]?it|beforeAll|beforeEach|afterAll|afterEach)',
        },
      ],

      // Disabled as it now reports issues - https://eslint.org/docs/latest/rules/no-implicit-globals
      // 'no-implicit-globals': ['error'],
      'require-yield': 'error',
      'template-curly-spacing': ['error', 'never'],
      'mocha/no-exclusive-tests': 'error',

      'import/order': [
        'error',
        {
          'newlines-between': 'always',

          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],

      'import/no-cycle': [
        'error',
        {
          maxDepth: Infinity,
        },
      ],

      'no-restricted-syntax': ['error'],
      'rulesdir/prettier-comments': 'error',
      'rulesdir/extensions': 'error',
      'rulesdir/check-license': 'error',
    },
  },
  ...compat
    .extends(
      'plugin:@typescript-eslint/eslint-recommended',
      'plugin:@typescript-eslint/recommended',
      'plugin:@typescript-eslint/stylistic'
    )
    .map(config => {
      return {
        ...config,
        files: ['**/*.ts'],
      };
    }),
  {
    files: ['**/*.ts'],

    plugins: {
      tsdoc,
    },

    languageOptions: {
      ecmaVersion: 5,
      sourceType: 'script',

      parserOptions: {
        allowAutomaticSingleRunInference: true,
        project: './tsconfig.base.json',
      },
    },

    rules: {
      'rulesdir/use-using': 'error',
      curly: ['error', 'all'],
      'arrow-body-style': ['error', 'always'],

      '@typescript-eslint/array-type': [
        'error',
        {
          default: 'array-simple',
        },
      ],

      'no-unused-vars': 'off',

      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],

      'func-call-spacing': 'off',
      semi: 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-use-before-define': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unnecessary-template-expression': 'error',
      '@typescript-eslint/no-unsafe-function-type': 'error',
      '@typescript-eslint/no-wrapper-object-types': 'error',

      '@typescript-eslint/explicit-module-boundary-types': 'error',

      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.name='require']",
          message: '`require` statements are not allowed. Use `import`.',
        },
      ],

      '@typescript-eslint/no-floating-promises': [
        'error',
        {
          ignoreVoid: true,
          ignoreIIFE: true,
        },
      ],

      '@typescript-eslint/prefer-ts-expect-error': 'error',
      '@typescript-eslint/return-await': ['error', 'always'],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/consistent-type-exports': 'error',
      '@typescript-eslint/no-import-type-side-effects': 'error',
    },
  },
  {
    files: ['packages/puppeteer-core/src/**/*.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          message: 'Use method `Deferred.race()` instead.',
          selector:
            'MemberExpression[object.name="Promise"][property.name="race"]',
        },
        {
          message:
            'Deferred `valueOrThrow` should not be called in `Deferred.race()` pass deferred directly',
          selector:
            'CallExpression[callee.object.name="Deferred"][callee.property.name="race"] > ArrayExpression > CallExpression[callee.property.name="valueOrThrow"]',
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: ['*Events', '*.test.js'],
          paths: [...getThirdPartyPackages()],
        },
      ],
    },
  },
  {
    files: [
      'packages/puppeteer-core/src/**/*.test.ts',
      'tools/mocha-runner/src/test.ts',
    ],
    rules: {
      // With the Node.js test runner, `describe` and `it` are technically
      // promises, but we don't need to await them.
      '@typescript-eslint/no-floating-promises': 'off',
    },
  },
  {
    files: ['packages/**/*.ts'],

    rules: {
      'tsdoc/syntax': 'error',
    },
  },
];
