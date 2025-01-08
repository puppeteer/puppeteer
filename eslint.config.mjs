/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import fs from 'node:fs';
import path from 'node:path';

import {FlatCompat} from '@eslint/eslintrc';
import js from '@eslint/js';
import stylisticPlugin from '@stylistic/eslint-plugin';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import mocha from 'eslint-plugin-mocha';
import eslintPrettierPluginRecommended from 'eslint-plugin-prettier/recommended';
import rulesdir from 'eslint-plugin-rulesdir';
import tsdoc from 'eslint-plugin-tsdoc';
import globals from 'globals';

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

rulesdir.RULES_DIR = 'tools/eslint/lib';

function getThirdPartyPackages() {
  return fs
    .readdirSync(
      path.join(import.meta.dirname, 'packages/puppeteer-core/third_party'),
      {
        withFileTypes: true,
      },
    )
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
  eslintPrettierPluginRecommended,
  importPlugin.flatConfigs.typescript,
  {
    name: 'JavaScript rules',
    plugins: {
      mocha,
      '@typescript-eslint': typescriptEslint,
      import: importPlugin,
      rulesdir,
      '@stylistic': stylisticPlugin,
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

      'prefer-const': 'error',

      'max-len': [
        'error',
        {
          /* this setting doesn't impact things as we use Prettier to format
           * our code and hence dictate the line length.
           * Prettier aims for 80 but sometimes makes the decision to go just
           * over 80 chars as it decides that's better than wrapping. ESLint's
           * rule defaults to 80 but therefore conflicts with Prettier. So we
           * set it to something far higher than Prettier would allow to avoid
           * it causing issues and conflicting with Prettier.
           */
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

      '@stylistic/func-call-spacing': 'error',
      '@stylistic/semi': 'error',

      // Keeps comments formatted.
      'rulesdir/prettier-comments': 'error',
      // Enforces consistent file extension
      'rulesdir/extensions': 'error',
      // Enforces license headers on files
      'rulesdir/check-license': 'error',
    },
  },
  ...compat
    .extends(
      'plugin:@typescript-eslint/eslint-recommended',
      'plugin:@typescript-eslint/recommended',
      'plugin:@typescript-eslint/stylistic',
    )
    .map(config => {
      return {
        ...config,
        files: ['**/*.ts'],
      };
    }),
  {
    name: 'TypeScript rules',
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
      // Enforces clean up of used resources.
      'rulesdir/use-using': 'error',

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

      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-use-before-define': 'off',
      // We have to use any on some types so the warning isn't valuable.
      '@typescript-eslint/no-explicit-any': 'off',
      // We don't require explicit return types on basic functions or
      // dummy functions in tests, for example
      '@typescript-eslint/explicit-function-return-type': 'off',
      // We allow non-null assertions if the value was asserted using `assert` API.
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unnecessary-template-expression': 'error',
      '@typescript-eslint/no-unsafe-function-type': 'error',
      '@typescript-eslint/no-wrapper-object-types': 'error',

      // By default this is a warning but we want it to error.
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
      // This is more performant; see https://v8.dev/blog/fast-async.
      '@typescript-eslint/return-await': ['error', 'always'],
      // This optimizes the dependency tracking for type-only files.
      '@typescript-eslint/consistent-type-imports': 'error',
      // So type-only exports get elided.
      '@typescript-eslint/consistent-type-exports': 'error',
      // Don't want to trigger unintended side-effects.
      '@typescript-eslint/no-import-type-side-effects': 'error',
      // Prefer interfaces over types for shape like.
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
    },
  },
  {
    name: 'Puppeteer Core syntax',
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
    name: 'Packages',
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
  {
    name: 'Mocha',
    files: ['test/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          /**
           * The mocha tests run on the compiled output in the /lib directory
           * so we should avoid importing from src.
           */
          patterns: ['*src*'],
        },
      ],
    },
  },
  {
    name: 'Mocha Tests',
    files: ['test/**/*.spec.ts'],

    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],

      'no-restricted-syntax': [
        'error',
        {
          message:
            'Use helper command `launch` to make sure the browsers get cleaned',
          selector:
            'MemberExpression[object.name="puppeteer"][property.name="launch"]',
        },
        {
          message: 'Unexpected debugging mocha test.',
          selector:
            'CallExpression[callee.object.name="it"] > MemberExpression > Identifier[name="deflake"], CallExpression[callee.object.name="it"] > MemberExpression > Identifier[name="deflakeOnly"]',
        },
        {
          message: 'No `expect` in EventHandler. They will never throw errors',
          selector:
            'CallExpression[callee.property.name="on"] BlockStatement > :not(TryStatement) > ExpressionStatement > CallExpression[callee.object.callee.name="expect"]',
        },
      ],
    },
  },
];
