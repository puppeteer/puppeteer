const path = require('path');
const jsBuilder = require('./JSBuilder');
const mdBuilder = require('./MDBuilder');
const Documentation = require('./Documentation');
const Browser = require('../../lib/Browser');

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
 * @param {!Page} page
 * @param {string} docsFolderPath
 * @param {string} jsFolderPath
 * @return {!Promise<!Array<string>>}
 */
async function lint(page, docsFolderPath, jsFolderPath) {
  let mdResult = await mdBuilder(page, docsFolderPath);
  let jsResult = await jsBuilder(jsFolderPath);
  let jsDocumentation = filterJSDocumentation(jsResult);
  let mdDocumentation = mdResult.documentation;
  let diff = Documentation.diff(mdDocumentation, jsDocumentation);

  let jsErrors = [];
  let mdErrors = [];

  // Report all markdown parse errors.
  mdErrors.push(...mdResult.errors);
  {
    // Report duplicate JavaScript classes.
    let jsClasses = new Map();
    for (let jsClass of jsDocumentation.classesArray) {
      if (jsClasses.has(jsClass.name))
        jsErrors.push(`Duplicate declaration of class ${jsClass.name}`);
      jsClasses.set(jsClass.name, jsClass);
    }
  }
  {
    // Report duplicate MarkDown classes.
    let mdClasses = new Map();
    for (let mdClass of mdDocumentation.classesArray) {
      if (mdClasses.has(mdClass.name))
        mdErrors.push(`Duplicate declaration of class ${mdClass.name}`);
      mdClasses.set(mdClass.name, mdClass);
    }
  }
  {
    // Make sure class constructors are defined before other methods.
    for (let mdClass of mdDocumentation.classesArray) {
      let constructorMethod = mdClass.methods.get('constructor');
      if (!constructorMethod)
        continue;
      if (mdClass.methodsArray[0] !== constructorMethod)
        mdErrors.push(`Constructor of ${mdClass.name} should go before other methods`);
    }
  }
  {
    // Methods should be sorted alphabetically.
    for (let mdClass of mdDocumentation.classesArray) {
      for (let i = 0; i < mdClass.methodsArray.length - 1; ++i) {
        // Constructor should always go first.
        if (mdClass.methodsArray[i].name === 'constructor')
          continue;
        let method1 = mdClass.methodsArray[i];
        let method2 = mdClass.methodsArray[i + 1];
        if (method1.name > method2.name)
          mdErrors.push(`${mdClass.name}.${method1.name} breaks alphabetic sorting inside class ${mdClass.name}`);
      }
    }
  }
  // Report non-existing and missing classes.
  mdErrors.push(...diff.extraClasses.map(className => `Non-existing class found: ${className}`));
  mdErrors.push(...diff.missingClasses.map(className => `Class not found: ${className}`));
  mdErrors.push(...diff.extraMethods.map(methodName => `Non-existing method found: ${methodName}`));
  mdErrors.push(...diff.missingMethods.map(methodName => `Method not found: ${methodName}`));
  mdErrors.push(...diff.extraProperties.map(propertyName => `Non-existing property found: ${propertyName}`));
  mdErrors.push(...diff.missingProperties.map(propertyName => `Property not found: ${propertyName}`));
  {
    // Report badly described arguments.
    for (let badArgument of diff.badArguments) {
      let text = [`Method ${badArgument.method} fails to describe its parameters:`];
      for (let missing of badArgument.missingArgs)
        text.push(`- Missing description for "${missing}"`);
      for (let extra of badArgument.extraArgs)
        text.push(`- Described non-existing parameter "${extra}"`);
      mdErrors.push(text.join('\n'));
    }
  }
  // Push all errors with proper prefixes
  let errors = jsErrors.map(error => '[JavaScript] ' + error);
  errors.push(...mdErrors.map(error => '[MarkDown] ' + error));
  return errors;
}

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

module.exports = lint;

const RED_COLOR = '\x1b[31m';
const RESET_COLOR = '\x1b[0m';

// Handle CLI invocation.
if (!module.parent) {
  const startTime = Date.now();
  const browser = new Browser({args: ['--no-sandbox']});
  browser.newPage().then(async page => {
    const errors = await lint(page, path.join(PROJECT_DIR, 'docs'), path.join(PROJECT_DIR, 'lib'));
    await browser.close();
    if (errors.length) {
      console.log('Documentation Failures:');
      for (let i = 0; i < errors.length; ++i) {
        let error = errors[i];
        error = error.split('\n').join('\n    ');
        console.log(`${i + 1}) ${RED_COLOR}${error}${RESET_COLOR}`);
      }
    }
    console.log(`${errors.length} failures`);
    const runningTime = Date.now() - startTime;
    console.log(`Finished in ${runningTime / 1000} seconds`);
    process.exit(errors.length > 0 ? 1 : 0);
  });
}
