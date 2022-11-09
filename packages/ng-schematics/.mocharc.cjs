module.exports = {
  logLevel: 'debug',
  spec: 'test/build/**/*.spec.js',
  exit: !!process.env.CI,
  reporter: process.env.CI ? 'spec' : 'dot',
};
