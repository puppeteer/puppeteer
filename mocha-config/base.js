module.exports = {
  reporter: 'dot',
  // Allow `console.log`s to show up during test execution
  logLevel: 'debug',
  exit: !!process.env.CI,
};
