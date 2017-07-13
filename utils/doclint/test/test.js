const fs = require('fs');
const rm = require('rimraf').sync;
const path = require('path');
const Browser = require('../../../lib/Browser');
const doclint = require('../lint');
const GoldenUtils = require('../../../test/golden-utils');

const OUTPUT_DIR = path.join(__dirname, 'output');
const GOLDEN_DIR = path.join(__dirname, 'golden');

const browser = new Browser({args: ['--no-sandbox']});
let page;
let specName;

jasmine.getEnv().addReporter({
  specStarted: result => specName = result.description
});

beforeAll(SX(async function() {
  page = await browser.newPage();
  if (fs.existsSync(OUTPUT_DIR))
    rm(OUTPUT_DIR);
}));

afterAll(SX(async function() {
  await browser.close();
}));

beforeEach(function() {
  GoldenUtils.addMatchers(jasmine, GOLDEN_DIR, OUTPUT_DIR);
});

describe('doclint', function() {
  it('01-class-errors', SX(test));
  it('02-method-errors', SX(test));
  it('03-property-errors', SX(test));
  it('04-bad-arguments', SX(test));
  it('05-outdated-toc', SX(test));
});

async function test() {
  const filePath = path.join(__dirname, specName);
  const errors = await doclint(page, filePath, filePath);
  expect(errors.join('\n')).toBeGolden(specName + '.txt');
}

// Since Jasmine doesn't like async functions, they should be wrapped
// in a SX function.
function SX(fun) {
  return done => Promise.resolve(fun()).then(done).catch(done.fail);
}
