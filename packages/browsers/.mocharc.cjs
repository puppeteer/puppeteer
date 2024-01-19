module.exports = {
  logLevel: 'debug',
  spec: 'test/build/**/*.spec.js',
  require: ['./test/build/mocha-utils.js'],
  exit: !!process.env.CI,
  reporter: 'spec',
  timeout: 10_000,
};
