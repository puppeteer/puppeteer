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

  plugins: ['mocha', '@typescript-eslint', 'import'],

  extends: ['plugin:prettier/recommended', 'plugin:import/typescript'],

  settings: {
    'import/resolver': {
      typescript: true,
    },
  },

  rules: {
    // Brackets keep code readable.
    curly: ['error', 'all'],
    // Brackets keep code readable and `return` intentions clear.
    'arrow-body-style': ['error', 'always'],
    // Error if files are not formatted with Prettier correctly.
    'prettier/prettier': 'error',
    // syntax preferences
    'spaced-comment': [
      'error',
      'always',
      {
        markers: ['*'],
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
    // anti-patterns
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
    'no-implicit-globals': ['error'],

    // es2015 features
    'require-yield': 'error',
    'template-curly-spacing': ['error', 'never'],

    // ensure we don't have any it.only or describe.only in prod
    'mocha/no-exclusive-tests': 'error',

    'import/order': [
      'error',
      {
        'newlines-between': 'always',
        alphabetize: {order: 'asc', caseInsensitive: true},
      },
    ],

    'import/no-cycle': ['error', {maxDepth: Infinity}],

    'no-restricted-syntax': [
      'error',
      // Don't allow underscored declarations on camelCased variables/properties.
      // ...RESTRICTED_UNDERSCORED_IDENTIFIERS,
    ],
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
      plugins: ['eslint-plugin-tsdoc', 'rulesdir'],
      rules: {
        // Keeps comments formatted.
        'rulesdir/prettier-comments': 'error',
        // Enforces clean up of used resources.
        'rulesdir/use-using': 'error',
        // Enforces consistent file extension
        'rulesdir/extensions': 'error',
        // Brackets keep code readable.
        curly: ['error', 'all'],
        // Brackets keep code readable and `return` intentions clear.
        'arrow-body-style': ['error', 'always'],
        // Error if comments do not adhere to `tsdoc`.
        'tsdoc/syntax': 'error',
        // Keeps array types simple only when they are simple for readability.
        '@typescript-eslint/array-type': ['error', {default: 'array-simple'}],
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': [
          'error',
          {argsIgnorePattern: '^_', varsIgnorePattern: '^_'},
        ],
        'func-call-spacing': 'off',
        '@typescript-eslint/func-call-spacing': 'error',
        semi: 'off',
        '@typescript-eslint/semi': 'error',
        '@typescript-eslint/no-empty-function': 'off',
        '@typescript-eslint/no-use-before-define': 'off',
        // We have to use any on some types so the warning isn't valuable.
        '@typescript-eslint/no-explicit-any': 'off',
        // We don't require explicit return types on basic functions or
        // dummy functions in tests, for example
        '@typescript-eslint/explicit-function-return-type': 'off',
        // We allow non-null assertions if the value was asserted using `assert` API.
        '@typescript-eslint/no-non-null-assertion': 'off',
        /**
         * This is the default options (as per
         * https://github.com/typescript-eslint/typescript-eslint/blob/HEAD/packages/eslint-plugin/docs/rules/ban-types.md),
         *
         * Unfortunately there's no way to
         */
        '@typescript-eslint/ban-types': [
          'error',
          {
            extendDefaults: true,
            types: {
              /*
               * Puppeteer's API accepts generic functions in many places so it's
               * not a useful linting rule to ban the `Function` type. This turns off
               * the banning of the `Function` type which is a default rule.
               */
              Function: false,
            },
          },
        ],
        // By default this is a warning but we want it to error.
        '@typescript-eslint/explicit-module-boundary-types': 'error',
        'no-restricted-syntax': [
          'error',
          {
            // Never use `require` in TypeScript since they are transpiled out.
            selector: "CallExpression[callee.name='require']",
            message: '`require` statements are not allowed. Use `import`.',
          },
          {
            // We need this as NodeJS will run until all the timers have resolved
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
        '@typescript-eslint/no-floating-promises': [
          'error',
          {ignoreVoid: true, ignoreIIFE: true},
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
      ],
    },
  ],
};
