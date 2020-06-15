module.exports = {
  reporter: 'dot',
  // Allow `console.logs` to show up during test execution
  logLevel: 'debug',
  exit: !!process.env.CI,
};
