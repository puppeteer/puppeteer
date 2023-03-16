# Mocha Runner

Mocha Runner is a test runner on top of mocha. It uses `/test/TestSuites.json` and `/test/TestExpectations.json` files to run mocha tests in multiple configurations and interpret results.

## Running tests for Mocha Runner itself.

```
npm run build && npx c8 node tools/mochaRunner/lib/test.js
```

## Running tests using Mocha Runner

```
npm run build && npm run test
```

By default, the runner runs all test suites applicable to the current platform.
To pick a test suite, provide the `--test-suite` arguments. For example,

```
npm run build && npm run test -- --test-suite chrome-headless
```

## TestSuites.json

Define test suites via the `testSuites` attribute. `parameters` can be used in the `TestExpectations.json` to disable tests
based on parameters. The meaning for parameters is defined in `parameterDefinitions` which tell what env object corresponds
to the given parameter.

## TestExpectations.json

An expectation looks like this:

```
  {
    "testIdPattern": "[accessibility.spec]",
    "platforms": ["darwin", "win32", "linux"],
    "parameters": ["firefox"],
    "expectations": ["SKIP"]
  }
```

`testIdPattern` defines a string that will be used to prefix-match tests. `platforms` defines the platforms the expectation is for (`or`-logic).
`parameters` defines the parameters that the test has to match (`and`-logic). `expectations` is the list of test results that are considered to be acceptable.

Currently, expectations are updated manually. The test runner outputs the suggested changes to the expectation file if the test run does not match
expectations.
