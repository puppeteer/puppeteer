const path = require('path');
const jsBuilder = require('./JSBuilder');
const mdBuilder = require('./MDBuilder');
const Documentation = require('./Documentation');

const PROJECT_DIR = path.join(__dirname, '..', '..');

let EXCLUDE_CLASSES = new Set([
  'Connection',
  'FrameManager',
  'Helper',
  'Navigator',
  'NetworkManager',
  'ProxyStream'
]);

let EXCLUDE_METHODS = new Set([
  'Body.constructor',
  'Dialog.constructor',
  'Frame.constructor',
  'Headers.constructor',
  'Headers.fromPayload',
  'InterceptedRequest.constructor',
  'Page.constructor',
  'Page.create',
  'Request.constructor',
  'Response.constructor',
]);

/**
 * @param {!Documentation} jsDocumentation
 * @return {!Documentation}
 */
function filterJSDocumentation(jsDocumentation) {
  // Filter classes and methods.
  let classes = [];
  for (let cls of jsDocumentation.classesArray) {
    if (EXCLUDE_CLASSES.has(cls.name))
      continue;
    let methods = cls.methodsArray.filter(method => {
      if (method.name.startsWith('_'))
        return false;
      return !EXCLUDE_METHODS.has(`${cls.name}.${method.name}`);
    });
    let properties = cls.propertiesArray.filter(property => !property.startsWith('_'));
    classes.push(new Documentation.Class(cls.name, methods, properties));
  }
  return new Documentation(classes);
}

let jsDocumentation;
let mdDocumentation;
let mdParseErrors;
let diff;

beforeAll(SX(async function() {
  jsDocumentation = filterJSDocumentation(await jsBuilder(path.join(PROJECT_DIR, 'lib')));
  let mdDoc = await mdBuilder(path.join(PROJECT_DIR, 'docs'));
  mdDocumentation = mdDoc.documentation;
  mdParseErrors = mdDoc.errors;
  diff = Documentation.diff(mdDocumentation, jsDocumentation);
}));

describe('JavaScript documentation parser', function() {
  it('should not contain any duplicate classes (probably error in parsing!)', () => {
    let jsClasses = new Map();
    for (let jsClass of jsDocumentation.classesArray) {
      if (jsClasses.has(jsClass.name))
        fail(`JavaScript has duplicate declaration of ${jsClass.name}. (This probably means that this linter has an error)`);
      jsClasses.set(jsClass.name, jsClass);
    }
  });
});

describe('Markdown Documentation', function() {
  it('should not have any parse errors', () => {
    for (let error of mdParseErrors)
      fail(error);
  });
  it('should not contain any duplicate classes', () => {
    let mdClasses = new Map();
    for (let mdClass of mdDocumentation.classesArray) {
      if (mdClasses.has(mdClass.name))
        fail(`Documentation has duplicate declaration of class ${mdClass.name}`);
      mdClasses.set(mdClass.name, mdClass);
    }
  });
  it('class constructors should be defined before other methods', () => {
    for (let mdClass of mdDocumentation.classesArray) {
      let constructorMethod = mdClass.methods.get('constructor');
      if (!constructorMethod)
        continue;
      if (mdClass.methodsArray[0] !== constructorMethod)
        fail(`Method 'new ${mdClass.name}' should go before other methods of class ${mdClass.name}`);
    }
  });
  it('methods should be sorted alphabetically', () => {
    for (let mdClass of mdDocumentation.classesArray) {
      for (let i = 0; i < mdClass.methodsArray.length - 1; ++i) {
        // Constructor should always go first.
        if (mdClass.methodsArray[i].name === 'constructor')
          continue;
        let method1 = mdClass.methodsArray[i];
        let method2 = mdClass.methodsArray[i + 1];
        if (method1.name > method2.name)
          fail(`${mdClass.name}.${method1.name} breaks alphabetic sorting inside class ${mdClass.name}`);
      }
    }
  });
  it('should not contain any non-existing class', () => {
    for (let className of diff.extraClasses)
      fail(`Documentation describes non-existing class ${className}`);
  });
  it('should describe all existing classes', () => {
    for (let className of diff.missingClasses)
      fail(`Documentation lacks description of class ${className}`);
  });
  it('should not contain any non-existing methods', () => {
    for (let methodName of diff.extraMethods)
      fail(`Documentation describes non-existing method: ${methodName}`);
  });
  it('should describe all existing methods', () => {
    for (let methodName of diff.missingMethods)
      fail(`Documentation lacks method ${methodName}`);
  });
  it('should describe all arguments propertly', () => {
    for (let badArgument of diff.badArguments) {
      let text = [`Method ${badArgument.method} fails to describe its parameters:`];
      for (let missing of badArgument.missingArgs)
        text.push(`- Missing description for "${missing}"`);
      for (let extra of badArgument.extraArgs)
        text.push(`- Described non-existing parameter "${extra}"`);
      fail(text.join('\n'));
    }
  });
  it('should not contain any non-existing properties', () => {
    for (let propertyName of diff.extraProperties)
      fail(`Documentation describes non-existing property: ${propertyName}`);
  });
  it('should describe all existing properties', () => {
    for (let propertyName of diff.missingProperties)
      fail(`Documentation lacks property ${propertyName}`);
  });
});

// Since Jasmine doesn't like async functions, they should be wrapped
// in a SX function.
function SX(fun) {
  return done => Promise.resolve(fun()).then(done).catch(done.fail);
}

