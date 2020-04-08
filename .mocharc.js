module.exports = {
  file: ['./test/mocha-utils.js'],
  spec: 'test/*.spec.js',
  reporter: 'dot',
  timeout: process.env.PUPPETEER_PRODUCT === 'firefox' ? 15 * 1000 : 10 * 1000,
};
