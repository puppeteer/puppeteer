import {
  TestExpectation,
  MochaResults,
  zTestSuiteFile,
  zPlatform,
  TestSuite,
} from './types.js';

import path from 'path';
import fs from 'fs';
import os from 'os';
import {spawn} from 'node:child_process';
import {
  extendProcessEnv,
  filterByPlatform,
  prettyPrintJSON,
  readJSON,
  filterByParameters,
  getExpectationUpdates,
  getSkippedTests,
} from './utils.js';

async function main() {
  const testSuiteArgIdx = process.argv.indexOf('--test-suite');

  const platform = zPlatform.parse(os.platform());

  const expectations = readJSON(
    path.join(process.cwd(), 'test', 'TestExpectations.json')
  ) as TestExpectation[];

  const parsedSuitesFile = zTestSuiteFile.parse(
    readJSON(path.join(process.cwd(), 'test', 'TestSuites.json'))
  );

  let applicableSuites: TestSuite[] = [];

  if (testSuiteArgIdx === -1) {
    applicableSuites = filterByPlatform(parsedSuitesFile.testSuites, platform);
  } else {
    const testSuiteId = process.argv[testSuiteArgIdx + 1];
    const testSuite = parsedSuitesFile.testSuites.find(suite => {
      return suite.id === testSuiteId;
    });

    if (!testSuite) {
      console.error(`Test suite ${testSuiteId} is not defined`);
      process.exit(1);
    }

    if (!testSuite.platforms.includes(platform)) {
      console.warn(
        `Test suite ${testSuiteId} is not enabled for your platform. Running it anyway.`
      );
    }

    applicableSuites = [testSuite];
  }

  let fail = false;
  const recommendations = [];
  try {
    for (const suite of applicableSuites) {
      const parameters = suite.parameters;

      const applicableExpectations = filterByParameters(
        filterByPlatform(expectations, platform),
        parameters
      );

      const skippedTests = getSkippedTests(applicableExpectations);

      const env = extendProcessEnv([
        ...parameters.map(param => {
          return parsedSuitesFile.parameterDefinitons[param];
        }),
        {
          PUPPETEER_SKIPPED_TEST_CONFIG: JSON.stringify(
            skippedTests.map(ex => {
              return ex.testIdPattern;
            })
          ),
        },
      ]);

      const tmpdir = fs.mkdtempSync(
        path.join(os.tmpdir(), 'puppeteer-test-runner-')
      );
      const tmpfilename = path.join(tmpdir, 'output.json');
      console.log('Running', JSON.stringify(parameters), tmpfilename);
      const handle = spawn(
        'npx mocha',
        ['--reporter=json', '--reporter-option', 'output=' + tmpfilename],
        {
          shell: true,
          cwd: process.cwd(),
          stdio: 'inherit',
          env,
        }
      );
      await new Promise<void>((resolve, reject) => {
        handle.on('error', err => {
          reject(err);
        });
        handle.on('close', () => {
          resolve();
        });
      });
      console.log('Finished', JSON.stringify(parameters));
      try {
        const results = readJSON(tmpfilename) as MochaResults;
        console.log('Results from mocha');
        console.log('Stats', JSON.stringify(results.stats));
        results.pending.length > 0 && console.log('# Pending tests');
        for (const test of results.pending) {
          console.log(`\t? ${test.fullTitle} ${test.file}`);
        }
        results.failures.length > 0 && console.log('# Failed tests');
        for (const test of results.failures) {
          console.log(`\tF ${test.fullTitle} ${test.file}`, test.err);
        }
        const recommendation = getExpectationUpdates(
          results,
          applicableExpectations,
          {
            platforms: [os.platform()],
            parameters,
          }
        );
        if (recommendation.length > 0) {
          fail = true;
          recommendations.push(...recommendation);
        } else {
          console.log('Test run matches expecations');
          continue;
        }
        console.log('\n================\n');
      } catch (err) {
        fail = true;
        console.error(err);
      }
    }
  } catch (err) {
    console.log(err);
  } finally {
    const toAdd = recommendations.filter(item => {
      return item.action === 'add';
    });
    if (toAdd.length) {
      console.log(
        'Add the following to TestExpecations.json to ignore the error:'
      );
      prettyPrintJSON(
        toAdd.map(item => {
          return item.expectation;
        })
      );
    }
    const toRemove = recommendations.filter(item => {
      return item.action === 'remove';
    });
    if (toRemove.length) {
      console.log(
        'Remove the following from the TestExpecations.json to ignore the error:'
      );
      prettyPrintJSON(
        toRemove.map(item => {
          return item.expectation;
        })
      );
    }
    const toUpdate = recommendations.filter(item => {
      return item.action === 'update';
    });
    if (toUpdate.length) {
      console.log(
        'Update the following expectations in the TestExpecations.json to ignore the error:'
      );
      prettyPrintJSON(
        toUpdate.map(item => {
          return item.expectation;
        })
      );
    }
    process.exit(fail ? 1 : 0);
  }
}

main();
