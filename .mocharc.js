module.exports = {
  file: ['./test/mocha-utils.js'],
  spec: 'test/*.spec.js',
  reporter: 'dot',
  timeout: process.env.PUPPETEER_PRODUCT === 'firefox' ? 10000 : 5000,
};
