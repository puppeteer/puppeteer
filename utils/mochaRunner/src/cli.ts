import {TestExpectation, MochaResults, TestSuite} from './types.js';

import path from 'path';
import fs from 'fs';
import os from 'os';
import {spawn} from 'node:child_process';
import {
  extendProcessEnv,
  filterByPlatform,
  prettyPrintJSON,
  readJSON,
  traverseMatrix,
  validatePlatfrom,
} from './utils.js';
import {
  getExpectationsForModifiers,
  getExpectationUpdates,
  getSkippedTests,
} from './expectations.js';

async function main() {
  const platform = os.platform();

  validatePlatfrom(platform);

  const expectations = readJSON(
    path.join(process.cwd(), 'test', 'TestExpectations.json')
  ) as TestExpectation[];
  const suites = readJSON(
    path.join(process.cwd(), 'test', 'TestSuites.json')
  ) as TestSuite[];

  const applicableSuites = filterByPlatform(suites, platform);

  let fail = false;
  const recommendations = [];
  try {
    for (const suite of applicableSuites) {
      const iterator = traverseMatrix([], suite.dimensions);
      for (const modifiers of iterator) {
        const applicableExpectations = getExpectationsForModifiers(
          filterByPlatform(expectations, platform),
          modifiers
        );
        const skippedTests = getSkippedTests(applicableExpectations);
        const env = extendProcessEnv([
          ...modifiers,
          {
            PUPPETEER_SKIPPED_TEST_CONFIG: JSON.stringify(
              skippedTests.map(ex => {
                return {
                  fullTitle: ex.fullTitle,
                  filename: ex.filename,
                };
              })
            ),
          },
        ]);
        const tmpdir = fs.mkdtempSync(
          path.join(os.tmpdir(), 'puppeteer-test-runner-')
        );
        const tmpfilename = path.join(tmpdir, 'output.json');
        console.log('Running', JSON.stringify(modifiers), tmpfilename);
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
        console.log('Finished', JSON.stringify(modifiers));
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
              combination: modifiers,
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
