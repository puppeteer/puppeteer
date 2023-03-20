# Mocha Runner

Mocha Runner is a test runner on top of mocha.
It uses `/test/TestSuites.json` and `/test/TestExpectations.json` files to run mocha tests in multiple configurations and interpret results.

## Running tests for Mocha Runner itself.

```bash
npm run build && npx c8 node tools/mochaRunner/lib/test.js
```

## Running tests using Mocha Runner

```bash
npm run build && npm run test
```

By default, the runner runs all test suites applicable to the current platform.
To pick a test suite, provide the `--test-suite` arguments. For example,

```bash
npm run build && npm run test -- --test-suite chrome-headless
```

## TestSuites.json

Define test suites via the `testSuites` attribute. `parameters` can be used in the `TestExpectations.json` to disable tests
based on parameters. The meaning for parameters is defined in `parameterDefinitions` which tell what env object corresponds
to the given parameter.

## TestExpectations.json

An expectation looks like this:

```json
{
  "testIdPattern": "[accessibility.spec]",
  "platforms": ["darwin", "win32", "linux"],
  "parameters": ["firefox"],
  "expectations": ["SKIP"]
}
```

| Field           | Description                                                   | Type                                                                                                 | Match Logic |
| --------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ----------- |
| `testIdPattern` | Defines the full name (or pattern) to match against test name | string                                                                                               | -           |
| `platforms`     | Defines the platforms the expectation is for                  | Array<`linux` \| `win32` \|`darwin`>                                                                 | `OR`        |
| `parameters`    | Defines the parameters that the test has to match             | Array<[ParameterDefinitions](https://github.com/puppeteer/puppeteer/blob/main/test/TestSuites.json)> | `AND`       |
| `expectations`  | The list of test results that are considered to be acceptable | Array<`PASS` \| `FAIL` \| `TIMEOUT` \| `SKIP`>                                                       | `OR`        |

> Order of defining expectations matters. The latest expectation that is set will take president over earlier ones.

> Adding `SKIP` to `expectations` will prevent the test from running, no matter if there are other expectations.

### Using pattern in `testIdPattern`

Sometimes we want a whole group of test to run. For that we can use a
pattern to achieve.
Pattern are defined with the use of `*` (using greedy method).

Examples:
| Pattern | Description | Example Pattern | Example match |
|------------------------|---------------------------------------------------------------------------------------------|-----------------------------------|-------------------------------------------------------------------------------------------------------------------------|
| `*` | Match all tests | - | - |
| `[test.spec] *` | Matches tests for the given file | `[jshandle.spec] *` | `[jshandle] JSHandle JSHandle.toString should work for primitives` |
| `[test.spec] <text> *` | Matches tests with for a given test with a specific prefixed test (usually a describe node) | `[page.spec] Page Page.goto *` | `[page.spec] Page Page.goto should work`,<br>`[page.spec] Page Page.goto should work with anchor navigation` |
| `[test.spec] * <text>` | Matches test with a surfix | `[navigation.spec] * should work` | `[navigation.spec] navigation Page.goto should work`,<br>`[navigation.spec] navigation Page.waitForNavigation should work` |

## Updating Expectations

Currently, expectations are updated manually. The test runner outputs the
suggested changes to the expectation file if the test run does not match
expectations.
