const path = require('path');
const jsBuilder = require('../JSBuilder');
const mdBuilder = require('../MDBuilder');
const Documentation = require('../Documentation');
const Browser = require('../../../lib/Browser');

const browser = new Browser({args: ['--no-sandbox']});
let page;

beforeAll(SX(async function() {
  page = await browser.newPage();
}));

afterAll(SX(async function() {
  await browser.close();
}));

describe('doclint', function() {
  test('01-missing-class', diff => {
    expect(diff.missingClasses.length).toBe(1);
    expect(diff.missingClasses[0]).toBe('Foo');
  });
  test('02-extra-class', diff => {
    expect(diff.extraClasses.length).toBe(1);
    expect(diff.extraClasses[0]).toBe('Bar');
  });
  test('03-missing-method', diff => {
    expect(diff.missingMethods.length).toBe(1);
    expect(diff.missingMethods[0]).toBe('Foo.bar');
  });
  test('04-extra-method', diff => {
    expect(diff.extraMethods.length).toBe(1);
    expect(diff.extraMethods[0]).toBe('Foo.bar');
  });
  test('05-missing-property', diff => {
    expect(diff.missingProperties.length).toBe(1);
    expect(diff.missingProperties[0]).toBe('Foo.barProperty');
  });
  test('06-extra-property', diff => {
    expect(diff.extraProperties.length).toBe(1);
    expect(diff.extraProperties[0]).toBe('Foo.bazProperty');
  });
  test('07-bad-arguments', diff => {
    expect(diff.badArguments.length).toBe(1);
    expect(diff.badArguments[0]).toEqual({
      method: 'Foo.constructor',
      missingArgs: ['arg1'],
      extraArgs: ['arg2']
    });
  });
  test('08-outdated-table-of-contents', (diff, mdErrors) => {
    expect(mdErrors.length).toBe(1);
    expect(mdErrors[0]).toBe('Markdown TOC is outdated, run `yarn generate-toc`');
  });
});

async function test(folderName, func) {
  it(folderName, SX(async () => {
    const [jsResult, mdResult] = await Promise.all([
      jsBuilder(path.join(__dirname, folderName)),
      mdBuilder(page, path.join(__dirname, folderName))
    ]);
    const jsDocumentation = jsResult;
    const mdDocumentation = mdResult.documentation;
    func(Documentation.diff(mdDocumentation, jsDocumentation), mdResult.errors);
  }));
}

// Since Jasmine doesn't like async functions, they should be wrapped
// in a SX function.
function SX(fun) {
  return done => Promise.resolve(fun()).then(done).catch(done.fail);
}
