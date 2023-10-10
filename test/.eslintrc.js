module.exports = {
  rules: {
    'no-restricted-imports': [
      'error',
      {
        /** The mocha tests run on the compiled output in the /lib directory
         * so we should avoid importing from src.
         */
        patterns: ['*src*'],
      },
    ],
  },
  overrides: [
    {
      files: ['*.spec.ts'],
      rules: {
        '@typescript-eslint/no-unused-vars': [
          'error',
          {argsIgnorePattern: '^_', varsIgnorePattern: '^_'},
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
        ],
      },
    },
  ],
};
