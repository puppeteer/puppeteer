const { describe, it } = require('mocha');
const { getCoverageResults } = require('./coverage-utils.js');
const expect = require('expect');

const EXCLUDED_METHODS = new Set([
  'Puppeteer.registerCustomQueryHandler',
  'Puppeteer.unregisterCustomQueryHandler',
  'Puppeteer.customQueryHandlerNames',
  'Puppeteer.clearCustomQueryHandlers',
  'PuppeteerNode.connect',
  'PuppeteerNode.launch',
  'PuppeteerNode.executablePath',
  'PuppeteerNode.defaultArgs',
  'PuppeteerNode.createBrowserFetcher',
]);

describe('API coverage test', () => {
  it('calls every method', () => {
    if (!process.env.COVERAGE) return;

    const coverageMap = getCoverageResults();
    const missingMethods = [];
    for (const method of coverageMap.keys()) {
      if (!coverageMap.get(method) && !EXCLUDED_METHODS.has(method))
        missingMethods.push(method);
    }
    if (missingMethods.length) {
      console.error(
        '\nCoverage check failed: not all API methods called. See above output for list of missing methods.'
      );
      console.error(missingMethods.join('\n'));
    }

    // We know this will fail because we checked above
    // but we need the actual test to fail.
    expect(missingMethods.length).toEqual(0);
  });
});
