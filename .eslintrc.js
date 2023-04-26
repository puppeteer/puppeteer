module.exports = {
  root: true,
  env: {
    node: true,
    es6: true,
  },

  parser: '@typescript-eslint/parser',

  plugins: ['mocha', '@typescript-eslint', 'import'],

  extends: ['plugin:prettier/recommended'],

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

    'no-restricted-imports': [
      'error',
      {
        patterns: ['*Events'],
        paths: [
          {
            name: 'mitt',
            message:
              'Import `mitt` from the vendored location: third_party/mitt/index.js',
          },
        ],
      },
    ],
    'import/extensions': ['error', 'ignorePackages'],

    'import/order': [
      'error',
      {
        'newlines-between': 'always',
        alphabetize: {order: 'asc', caseInsensitive: true},
      },
    ],

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
      ],
      plugins: ['eslint-plugin-tsdoc', 'local'],
      rules: {
        // Keeps comments formatted.
        'local/prettier-comments': 'error',
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
          {argsIgnorePattern: '^_'},
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
        ],
        '@typescript-eslint/no-floating-promises': [
          'error',
          {ignoreVoid: true, ignoreIIFE: true},
        ],
      },
    },
  ],
};
