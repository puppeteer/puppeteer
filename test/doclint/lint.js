const fs = require('fs');
const path = require('path');
const JSOutline = require('./JSOutline');
const MDOutline = require('./MDOutline');
const Documentation = require('./Documentation');

let PROJECT_DIR = path.join(__dirname, '..', '..');

let EXCLUDE_CLASSES = new Set([
  'Helper',
  'FrameManager',
  'Navigator',
  'Connection'
]);

let EXCLUDE_METHODS = new Set([
  'frame.constructor',
  'dialog.constructor',
  'page.create',
  'page.constructor'
]);

// Build up documentation from JS sources.
let jsClassesArray = [];
let files = fs.readdirSync(path.join(PROJECT_DIR, 'lib'));
for (let file of files) {
  if (!file.endsWith('.js'))
    continue;
  let filePath = path.join(PROJECT_DIR, 'lib', file);
  let outline = new JSOutline(fs.readFileSync(filePath, 'utf8'));
  // Filter out private classes and methods.
  for (let cls of outline.classes) {
    if (EXCLUDE_CLASSES.has(cls.name))
      continue;
    let methodsArray = cls.methodsArray.filter(method => {
      if (method.name.startsWith('_'))
        return false;
      let shorthand = `${cls.name}.${method.name}`.toLowerCase();
      return !EXCLUDE_METHODS.has(shorthand);
    });
    jsClassesArray.push(new Documentation.Class(cls.name, methodsArray));
  }
}

// Build up documentation from MD sources.
let mdOutline = new MDOutline(fs.readFileSync(path.join(PROJECT_DIR, 'docs', 'api.md'), 'utf8'));
let mdClassesArray = mdOutline.classes;

describe('table of contents', function() {
  let tableOfContents;
  beforeAll(() => {
    let section = mdOutline.ast.find(token => token.type === 'section' && token.title.toLowerCase() === 'table of contents');
    // Expect the first child of a section to be a table of contents.
    tableOfContents = section ? section.body[0] : null;
  });

  it('should exist', () => {
    expect(tableOfContents).toBeTruthy();
    expect(tableOfContents.type).toBe('list');
  });
});

// Compare to codebase.
describe('api.md', function() {
  let mdClasses = new Map();
  let jsClasses = new Map();
  it('MarkDown should not contain any duplicate classes', () => {
    for (let mdClass of mdClassesArray) {
      if (mdClasses.has(mdClass.name))
        fail(`Documentation has duplicate declaration of ${mdClass.name}`);
      mdClasses.set(mdClass.name, mdClass);
    }
  });
  it('JavaScript should not contain any duplicate classes (probably error in parsing!)', () => {
    for (let jsClass of jsClassesArray) {
      if (jsClasses.has(jsClass.name))
        fail(`JavaScript has duplicate declaration of ${jsClass.name}. (This probably means that this linter has an error)`);
      jsClasses.set(jsClass.name, jsClass);
    }
  });
  it('class constructors should be defined before other methods', () => {
    for (let mdClass of mdClasses.values()) {
      let constructorMethod = mdClass.methods.get('constructor');
      if (!constructorMethod)
        continue;
      if (mdClass.methodsArray[0] !== constructorMethod)
        fail(`Method 'new ${mdClass.name}' should go before other methods of class ${mdClass.name}`);
    }
  });
  it('methods should be sorted alphabetically', () => {
    for (let mdClass of mdClasses.values()) {
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
    for (let mdClass of mdClasses.values()) {
      if (!jsClasses.has(mdClass.name))
        fail(`Documentation describes non-existing class ${mdClass.name}`);
    }
  });
  it('should describe all existing classes', () => {
    for (let jsClass of jsClasses.values()) {
      if (!mdClasses.has(jsClass.name))
        fail(`Documentation lacks description of class ${jsClass.name}`);
    }
  });
  it('should not contain any non-existing methods', () => {
    for (let mdClass of mdClasses.values()) {
      let jsClass = jsClasses.get(mdClass.name);
      if (!jsClass)
        continue;
      for (let method of mdClass.methods.values()) {
        if (!jsClass.methods.has(method.name))
          fail(`Documentation describes non-existing method: ${jsClass.name}.${method.name}()`);
      }
    }
  });
  it('should describe all existing methods', () => {
    for (let jsClass of jsClasses.values()) {
      let mdClass = mdClasses.get(jsClass.name);
      if (!mdClass)
        continue;
      for (let method of jsClass.methods.values()) {
        if (!mdClass.methods.has(method.name))
          fail(`Documentation lacks ${jsClass.name}.${method.name}()`);
      }
    }
  });
});

