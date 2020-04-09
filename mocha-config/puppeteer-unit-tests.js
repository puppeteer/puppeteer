const base = require('./base');

module.exports = {
  ...base,
  file: ['./test/mocha-utils.js'],
  spec: 'test/*.spec.js',
  timeout: process.env.PUPPETEER_PRODUCT === 'firefox' ? 15 * 1000 : 10 * 1000,
};
