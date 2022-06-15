module.exports = {
  rules: {
    'arrow-body-style': ['error', 'always'],
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
};
