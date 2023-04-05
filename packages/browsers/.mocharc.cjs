module.exports = {
  logLevel: 'debug',
  spec: 'test/build/**/*.spec.js',
  exit: !!process.env.CI,
  reporter: 'spec',
  timeout: 10_000,
};
