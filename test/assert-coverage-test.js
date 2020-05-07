const { describe, it } = require('mocha');
const { getCoverageResults } = require('./coverage-utils');
const expect = require('expect');

describe('API coverage test', () => {
  it('calls every method', () => {
    if (!process.env.COVERAGE) return;

    const coverageMap = getCoverageResults();
    const missingMethods = [];
    for (const method of coverageMap.keys()) {
      if (!coverageMap.get(method)) missingMethods.push(method);
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
