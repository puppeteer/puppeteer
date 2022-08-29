import {
  MochaTestResult,
  TestExpectation,
  MochaResults,
  TestResult,
  TestDimensionValue,
} from './types.js';
import {getFilename, isEqualObject} from './utils.js';

export function groupByFilename(
  expecations: TestExpectation[]
): Map<string, TestExpectation[]> {
  const byFile = new Map<string, TestExpectation[]>();
  for (const ex of expecations) {
    if (!byFile.has(ex.filename)) {
      byFile.set(ex.filename, [ex]);
    } else {
      byFile.get(ex.filename)!.push(ex);
    }
  }
  return byFile;
}

export function getExpectationsForModifiers(
  expecations: TestExpectation[],
  modifiers: TestDimensionValue[]
): TestExpectation[] {
  return expecations.filter(ex => {
    return ex.modifiers.every(mod => {
      return modifiers.find(e => {
        return isEqualObject(
          e as {[key: string]: unknown},
          mod as {[key: string]: unknown}
        );
      });
    });
  });
}

/**
 * The last expectation that matches the startsWith filter wins.
 */
export function findEffectiveExpecationForTest(
  expectations: Map<string, TestExpectation[]>,
  result: MochaTestResult
): TestExpectation | undefined {
  return expectations
    .get(getFilename(result.file))
    ?.filter(expecation => {
      if (result.fullTitle.startsWith(expecation.fullTitle)) {
        return true;
      }
      return false;
    })
    .pop();
}

type RecommendedExpecation = {
  expectation: TestExpectation;
  test: MochaTestResult;
  action: 'remove' | 'add' | 'update';
};

export function getExpectationUpdates(
  results: MochaResults,
  expecations: TestExpectation[],
  context: {
    platforms: NodeJS.Platform[];
    combination: TestDimensionValue[];
  }
): RecommendedExpecation[] {
  const byFile = groupByFilename(expecations);
  const output: RecommendedExpecation[] = [];

  for (const pass of results.passes) {
    const expectation = findEffectiveExpecationForTest(byFile, pass);
    if (expectation && !expectation.expectations.includes('PASS')) {
      output.push({
        expectation,
        test: pass,
        action: 'remove',
      });
    }
  }

  for (const failure of results.failures) {
    const expectation = findEffectiveExpecationForTest(byFile, failure);
    if (expectation) {
      if (
        !expectation.expectations.includes(getTestResultForFailure(failure))
      ) {
        output.push({
          expectation: {
            ...expectation,
            expectations: [
              ...expectation.expectations,
              getTestResultForFailure(failure),
            ],
          },
          test: failure,
          action: 'update',
        });
      }
    } else {
      output.push({
        expectation: {
          fullTitle: failure.fullTitle,
          filename: getFilename(failure.file),
          platforms: context.platforms,
          modifiers: context.combination,
          expectations: [getTestResultForFailure(failure)],
        },
        test: failure,
        action: 'add',
      });
    }
  }
  return output;
}

export function getTestResultForFailure(
  test: Pick<MochaTestResult, 'err'>
): TestResult {
  return test.err?.code === 'ERR_MOCHA_TIMEOUT' ? 'TIMEOUT' : 'FAIL';
}

export function getSkippedTests(
  expectations: TestExpectation[]
): TestExpectation[] {
  return expectations.filter(ex => {
    return ex.expectations.includes('SKIP');
  });
}
