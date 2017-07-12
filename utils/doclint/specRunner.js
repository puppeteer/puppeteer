const startTime = Date.now();
let allTests = [];
let titles = [];
let currentTest = null;

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
};

/**
 * @param {string} title
 * @param {function()} fun
 */
function describe(title, fun) {
  titles.push(title);
  fun();
  titles.pop();
}

/**
 * @param {string} title
 * @param {function()} fun
 */
function it(title, fun) {
  titles.push(title);
  allTests.push({
    errors: [],
    title: titles.join(' '),
    fun,
  });
  titles.pop();
}

/**
 * @param {string} msg
 */
function fail(msg) {
  currentTest.errors.push(msg);
}

function runSpecs() {
  console.log('Started\n');
  for (currentTest of allTests) {
    currentTest.fun();
    if (currentTest.errors.length)
      process.stdout.write(`${colors.red}F${colors.reset}`);
    else
      process.stdout.write(`${colors.green}.${colors.reset}`);
  }
  console.log('\n');
  reportErrors();
}

function reportErrors() {
  let failedTests = allTests.filter(test => !!test.errors.length);
  if (failedTests.length) {
    console.log('Failures:');
    for (let i = 0; i < failedTests.length; ++i) {
      let test = failedTests[i];
      console.log(`${i + 1}) ${test.title}`);
      console.log(`  Messages:`);
      for (let error of test.errors) {
        error = error.split('\n').join('\n      ');
        console.log('    * ' + colors.red + error + colors.reset);
      }
    }
    console.log('');
  }

  console.log(`Ran ${allTests.length} specs`);
  console.log(`${allTests.length} specs, ${failedTests.length} failures`);
  const runningTime = Date.now() - startTime;
  console.log(`Finished in ${runningTime / 1000} seconds`);
  process.exit(failedTests.length > 0 ? 1 : 0);
}

module.exports = {
  describe,
  it,
  fail,
  runSpecs,
};

