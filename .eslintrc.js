module.exports = {
  root: true,
  env: {
    node: true,
    es6: true,
  },

  parser: '@typescript-eslint/parser',

  plugins: ['mocha', '@typescript-eslint', 'unicorn', 'import'],

  extends: ['plugin:prettier/recommended'],

  rules: {
    // Error if files are not formatted with Prettier correctly.
    'prettier/prettier': 2,
    // syntax preferences
    quotes: [
      2,
      'single',
      {
        avoidEscape: true,
        allowTemplateLiterals: true,
      },
    ],
    'spaced-comment': [
      2,
      'always',
      {
        markers: ['*'],
      },
    ],
    eqeqeq: [2],
    'accessor-pairs': [
      2,
      {
        getWithoutSet: false,
        setWithoutGet: false,
      },
    ],
    'new-parens': 2,
    'func-call-spacing': 2,
    'prefer-const': 2,

    'max-len': [
      2,
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
    'no-var': 2,
    'no-with': 2,
    'no-multi-str': 2,
    'no-caller': 2,
    'no-implied-eval': 2,
    'no-labels': 2,
    'no-new-object': 2,
    'no-octal-escape': 2,
    'no-self-compare': 2,
    'no-shadow-restricted-names': 2,
    'no-cond-assign': 2,
    'no-debugger': 2,
    'no-dupe-keys': 2,
    'no-duplicate-case': 2,
    'no-empty-character-class': 2,
    'no-unreachable': 2,
    'no-unsafe-negation': 2,
    radix: 2,
    'valid-typeof': 2,
    'no-unused-vars': [
      2,
      {
        args: 'none',
        vars: 'local',
        varsIgnorePattern:
          '([fx]?describe|[fx]?it|beforeAll|beforeEach|afterAll|afterEach)',
      },
    ],
    'no-implicit-globals': [2],

    // es2015 features
    'require-yield': 2,
    'template-curly-spacing': [2, 'never'],

    // ensure we don't have any it.only or describe.only in prod
    'mocha/no-exclusive-tests': 'error',

    // enforce the variable in a catch block is named error
    'unicorn/catch-error-name': 'error',

    'no-restricted-imports': [
      'error',
      {
        patterns: ['*Events'],
        paths: [
          {
            name: 'mitt',
            message:
              'Import Mitt from the vendored location: vendor/mitt/src/index.js',
          },
        ],
      },
    ],
    'import/extensions': ['error', 'ignorePackages'],
  },
  overrides: [
    {
      files: ['*.ts'],
      extends: [
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended',
      ],
      rules: {
        'no-unused-vars': 0,
        '@typescript-eslint/no-unused-vars': 2,
        'func-call-spacing': 0,
        '@typescript-eslint/func-call-spacing': 2,
        semi: 0,
        '@typescript-eslint/semi': 2,
        '@typescript-eslint/no-empty-function': 0,
        '@typescript-eslint/no-use-before-define': 0,
        // We have to use any on some types so the warning isn't valuable.
        '@typescript-eslint/no-explicit-any': 0,
        // We don't require explicit return types on basic functions or
        // dummy functions in tests, for example
        '@typescript-eslint/explicit-function-return-type': 0,
        // We know it's bad and use it very sparingly but it's needed :(
        '@typescript-eslint/ban-ts-ignore': 0,
        /**
         * This is the default options (as per
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/ban-types.md),
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
        '@typescript-eslint/array-type': [
          2,
          {
            default: 'array-simple',
          },
        ],
      },
    },
    {
      files: ['test-browser/**/*.js'],
      parserOptions: {
        sourceType: 'module',
      },
      env: {
        es6: true,
        browser: true,
        es2020: true,
      },
    },
  ],
};
