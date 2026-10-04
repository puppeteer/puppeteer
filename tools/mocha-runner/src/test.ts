/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import assert from 'node:assert/strict';
import {describe, it} from 'node:test';

import type {Platform, TestExpectation, MochaTestResult} from './types.js';
import {
  filterByParameters,
  getTestResultForFailure,
  isWildCardPattern,
  testIdMatchesExpectationPattern,
  getExpectationUpdates,
} from './utils.js';
import {getFilename, extendProcessEnv} from './utils.js';

describe('extendProcessEnv', () => {
  it('should extend env variables for the subprocess', () => {
    const env = extendProcessEnv([{TEST: 'TEST'}, {TEST2: 'TEST2'}]);
    assert.equal(env['TEST'], 'TEST');
    assert.equal(env['TEST2'], 'TEST2');
  });
});

describe('getFilename', () => {
  it('extract filename for a path', () => {
    assert.equal(getFilename('/etc/test.ts'), 'test');
    assert.equal(getFilename('/etc/test.js'), 'test');
  });
});

describe('getTestResultForFailure', () => {
  it('should get a test result for a mocha failure', () => {
    assert.equal(
      getTestResultForFailure({err: {code: 'ERR_MOCHA_TIMEOUT'}}),
      'TIMEOUT',
    );
    assert.equal(getTestResultForFailure({err: {code: 'ERROR'}}), 'FAIL');
  });
});

describe('filterByParameters', () => {
  it('should filter a list of expectations by parameters', () => {
    const expectations: TestExpectation[] = [
      {
        testIdPattern:
          '[oopif.spec] OOPIF "after all" hook for "should keep track of a frames OOP state"',
        platforms: ['darwin'],
        parameters: ['firefox', 'headless'],
        expectations: ['FAIL'],
      },
    ];
    assert.equal(
      filterByParameters(expectations, ['firefox', 'headless']).length,
      1,
    );
    assert.equal(filterByParameters(expectations, ['firefox']).length, 0);
    assert.equal(
      filterByParameters(expectations, ['firefox', 'headless', 'other']).length,
      1,
    );
    assert.equal(filterByParameters(expectations, ['other']).length, 0);
  });
});

describe('isWildCardPattern', () => {
  it('should detect if an expectation is a wildcard pattern', () => {
    assert.equal(isWildCardPattern(''), false);
    assert.equal(isWildCardPattern('a'), false);
    assert.equal(isWildCardPattern('*'), true);

    assert.equal(isWildCardPattern('[queryHandler.spec]'), false);
    assert.equal(isWildCardPattern('[queryHandler.spec] *'), true);
    assert.equal(isWildCardPattern(' [queryHandler.spec] '), false);

    assert.equal(isWildCardPattern('[queryHandler.spec] Query'), false);
    assert.equal(isWildCardPattern('[queryHandler.spec] Page *'), true);
    assert.equal(
      isWildCardPattern('[queryHandler.spec] Page Page.goto *'),
      true,
    );
  });
});

describe('testIdMatchesExpectationPattern', () => {
  const expectations: Array<[string, boolean]> = [
    ['', false],
    ['*', true],
    ['* should work', true],
    ['* Page.setContent *', true],
    ['* should work as expected', false],
    ['Page.setContent *', false],
    ['[page.spec]', false],
    ['[page.spec] *', true],
    ['[page.spec] Page *', true],
    ['[page.spec] Page Page.setContent *', true],
    ['[page.spec] Page Page.setContent should work', true],
    ['[page.spec] Page * should work', true],
    ['[page.spec] * Page.setContent *', true],
    ['[jshandle.spec] *', false],
    ['[jshandle.spec] JSHandle should work', false],
  ];

  it('with MochaTest', () => {
    const test = {
      title: 'should work',
      file: 'page.spec.ts',
      fullTitle() {
        return 'Page Page.setContent should work';
      },
    };

    for (const [pattern, expected] of expectations) {
      assert.equal(
        testIdMatchesExpectationPattern(test, pattern),
        expected,
        `Expected "${pattern}" to yield "${expected}"`,
      );
    }
  });

  it('with MochaTestResult', () => {
    const test: MochaTestResult = {
      title: 'should work',
      file: 'page.spec.ts',
      fullTitle: 'Page Page.setContent should work',
    };

    for (const [pattern, expected] of expectations) {
      assert.equal(
        testIdMatchesExpectationPattern(test, pattern),
        expected,
        `Expected "${pattern}" to yield "${expected}"`,
      );
    }
  });
});

describe('getExpectationUpdates', () => {
  it('should generate an update for expectations if a test passed with a fail expectation', () => {
    const mochaResults = {
      stats: {tests: 1},
      pending: [],
      passes: [
        {
          fullTitle: 'Page Page.setContent should work',
          title: 'should work',
          file: 'page.spec.ts',
        },
      ],
      failures: [],
    };
    const expectations = [
      {
        testIdPattern: '[page.spec] Page Page.setContent should work',
        platforms: ['darwin'] as Platform[],
        parameters: ['test'],
        expectations: ['FAIL' as const],
      },
    ];
    const updates = getExpectationUpdates(
      mochaResults,
      expectations,
      {
        platforms: ['darwin'] as Platform[],
        parameters: ['test'],
      },
      false,
    );
    assert.deepEqual(updates, [
      {
        action: 'remove',
        basedOn: {
          expectations: ['FAIL'],
          parameters: ['test'],
          platforms: ['darwin'],
          testIdPattern: '[page.spec] Page Page.setContent should work',
        },
        expectation: {
          expectations: ['FAIL'],
          parameters: ['test'],
          platforms: ['darwin'],
          testIdPattern: '[page.spec] Page Page.setContent should work',
        },
      },
    ]);
  });

  it('should not generate an update for expectations if a test passed with a fail expectation when passing are ingored', () => {
    const mochaResults = {
      stats: {tests: 1},
      pending: [],
      passes: [
        {
          fullTitle: 'Page Page.setContent should work',
          title: 'should work',
          file: 'page.spec.ts',
        },
      ],
      failures: [],
    };
    const expectations = [
      {
        testIdPattern: '[page.spec] Page Page.setContent should work',
        platforms: ['darwin'] as Platform[],
        parameters: ['test'],
        expectations: ['FAIL' as const],
      },
    ];
    const updates = getExpectationUpdates(
      mochaResults,
      expectations,
      {
        platforms: ['darwin'] as Platform[],
        parameters: ['test'],
      },
      true,
    );
    assert.deepEqual(updates, []);
  });

  it('should not generate an update for successful retries', () => {
    const mochaResults = {
      stats: {tests: 1},
      pending: [],
      passes: [
        {
          fullTitle: 'Page Page.setContent should work',
          title: 'should work',
          file: 'page.spec.ts',
        },
      ],
      failures: [
        {
          fullTitle: 'Page Page.setContent should work',
          title: 'should work',
          file: 'page.spec.ts',
          err: {code: 'Timeout'},
        },
      ],
    };
    const updates = getExpectationUpdates(
      mochaResults,
      [],
      {
        platforms: ['darwin'],
        parameters: ['test'],
      },
      false,
    );
    assert.deepEqual(updates, []);
  });
});

describe('logger and Mocha Runner integration', async () => {
  const {logger, setLogCapture, getCapturedLogs, clearCapturedLogs} =
    await import('./interface.js');
  const {registerLogListeners} = await import('./reporter.js');
  const Mocha = (await import('mocha')).default;

  it('should dump logs only after a test fails and clean before next test start', async () => {
    setLogCapture(true);
    clearCapturedLogs();
    const logFn = logger('puppeteer:test');

    const dumpedOutputs: string[] = [];
    const origConsoleLog = console.log;
    console.log = (...args: unknown[]) => {
      dumpedOutputs.push(args.map(String).join(' '));
    };

    try {
      const mocha = new Mocha({reporter: 'base'});
      const suite = Mocha.Suite.create(mocha.suite, 'Test Suite');

      suite.beforeAll('setup all', () => {
        logFn?.('log from beforeAll');
      });

      suite.beforeEach('setup each', () => {
        logFn?.('log from beforeEach');
      });

      suite.addTest(
        new Mocha.Test('passing test', () => {
          logFn?.('log from passing test');
        }),
      );

      suite.addTest(
        new Mocha.Test('failing test', () => {
          logFn?.('log from failing test');
          throw new Error('test failure');
        }),
      );

      await new Promise<void>(resolve => {
        const runner = mocha.run(() => {
          resolve();
        });
        registerLogListeners(runner);
      });

      const fullOutput = dumpedOutputs.join('\n');
      assert.ok(
        !fullOutput.includes('log from beforeAll'),
        'beforeAll logs should not be dumped when test fails',
      );
      assert.ok(
        !fullOutput.includes('log from beforeEach'),
        'beforeEach logs should not be dumped when test fails',
      );
      assert.ok(
        !fullOutput.includes('log from passing test'),
        'Passing test logs should not be dumped',
      );
      assert.ok(
        fullOutput.includes(
          '"Test Suite failing test" failed. Here is a debug log:',
        ),
        'Failing test header should be dumped',
      );
      assert.ok(
        fullOutput.includes('puppeteer:test log from failing test'),
        'Failing test logs should be dumped',
      );
      assert.deepEqual(
        getCapturedLogs(),
        [],
        'Captured logs should be empty after run',
      );
    } finally {
      console.log = origConsoleLog;
      setLogCapture(false);
      clearCapturedLogs();
    }
  });

  it('should dump logs when a hook fails', async () => {
    setLogCapture(true);
    clearCapturedLogs();
    const logFn = logger('puppeteer:hook');

    const dumpedOutputs: string[] = [];
    const origConsoleLog = console.log;
    console.log = (...args: unknown[]) => {
      dumpedOutputs.push(args.map(String).join(' '));
    };

    try {
      const mocha = new Mocha({reporter: 'base'});
      const suite = Mocha.Suite.create(mocha.suite, 'Hook Suite');

      suite.beforeEach('failing hook', () => {
        logFn?.('log from failing beforeEach hook');
        throw new Error('hook error');
      });

      suite.addTest(
        new Mocha.Test('test that will not run', () => {
          logFn?.('should not reach here');
        }),
      );

      await new Promise<void>(resolve => {
        const runner = mocha.run(() => {
          resolve();
        });
        registerLogListeners(runner);
      });

      const fullOutput = dumpedOutputs.join('\n');
      assert.ok(
        fullOutput.includes('failed. Here is a debug log:'),
        'Failed hook should trigger debug log dump',
      );
      assert.ok(
        fullOutput.includes('puppeteer:hook log from failing beforeEach hook'),
        'Hook logs should be dumped',
      );
    } finally {
      console.log = origConsoleLog;
      setLogCapture(false);
      clearCapturedLogs();
    }
  });

  it('should respect RUNNER_DEBUG', async () => {
    const origRunnerDebug = process.env['RUNNER_DEBUG'];
    try {
      process.env['RUNNER_DEBUG'] = '1';
      setLogCapture(false);
      clearCapturedLogs();
      const {debug} = await import('puppeteer-core/internal/common/Debug.js');
      const logFn = debug('puppeteer:debug');
      logFn?.('logged because RUNNER_DEBUG is set');
      assert.deepEqual(getCapturedLogs(), [
        'puppeteer:debug logged because RUNNER_DEBUG is set',
      ]);
    } finally {
      if (origRunnerDebug === undefined) {
        delete process.env['RUNNER_DEBUG'];
      } else {
        process.env['RUNNER_DEBUG'] = origRunnerDebug;
      }
      setLogCapture(false);
      clearCapturedLogs();
    }
  });
});
