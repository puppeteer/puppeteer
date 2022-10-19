const {join} = require('path');

/**
 * @type {import("puppeteer").PuppeteerConfiguration}
 */
module.exports = {
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};
