const fs = require('fs');
const path = require('path');
const esprima = require('esprima');
const ESTreeWalker = require('../../third_party/chromium/ESTreeWalker');
const Documentation = require('./Documentation');

class JSOutline {
  constructor(text) {
    this.classes = [];
    this.errors = [];
    this._eventsByClassName = new Map();
    this._currentClassName = null;
    this._currentClassMembers = [];

    this._text = text;
    let ast = esprima.parseScript(this._text, {loc: true, range: true});
    let walker = new ESTreeWalker(node => {
      if (node.type === 'ClassDeclaration')
        this._onClassDeclaration(node);
      else if (node.type === 'MethodDefinition')
        this._onMethodDefinition(node);
      else if (node.type === 'AssignmentExpression')
        this._onAssignmentExpression(node);
    });
    walker.walk(ast);
    this._flushClassIfNeeded();
    this._recreateClassesWithEvents();
  }

  _onClassDeclaration(node) {
    this._flushClassIfNeeded();
    this._currentClassName = this._extractText(node.id);
  }

  _onMethodDefinition(node) {
    console.assert(this._currentClassName !== null);
    console.assert(node.value.type === 'FunctionExpression');
    let methodName = this._extractText(node.key);
    if (node.kind === 'get') {
      let property = Documentation.Member.createProperty(methodName);
      this._currentClassMembers.push(property);
      return;
    }
    // Async functions have return value.
    let hasReturn = node.value.async;
    // Extract properties from constructor.
    if (node.kind === 'constructor') {
      // Extract properties from constructor.
      let walker = new ESTreeWalker(node => {
        if (node.type !== 'AssignmentExpression')
          return;
        node = node.left;
        if (node.type === 'MemberExpression' && node.object &&
            node.object.type === 'ThisExpression' && node.property &&
            node.property.type === 'Identifier')
          this._currentClassMembers.push(Documentation.Member.createProperty(node.property.name));
      });
      walker.walk(node);
    } else if (!hasReturn) {
      let walker = new ESTreeWalker(node => {
        if (node.type === 'FunctionExpression' || node.type === 'FunctionDeclaration' || node.type === 'ArrowFunctionExpression')
          return ESTreeWalker.SkipSubtree;
        if (node.type === 'ReturnStatement')
          hasReturn = hasReturn || !!node.argument;
      });
      walker.walk(node.value.body);
    }
    const args = [];
    for (let param of node.value.params) {
      if (param.type === 'AssignmentPattern')
        args.push(new Documentation.Argument(param.left.name));
      else if (param.type === 'RestElement')
        args.push(new Documentation.Argument('...' + param.argument.name));
      else if (param.type === 'Identifier')
        args.push(new Documentation.Argument(param.name));
      else
        this.errors.push(`JS Parsing issue: unsupported syntax to define parameter in ${this._currentClassName}.${methodName}(): ${this._extractText(param)}`);
    }
    let method = Documentation.Member.createMethod(methodName, args, hasReturn, node.value.async);
    this._currentClassMembers.push(method);
    return ESTreeWalker.SkipSubtree;
  }

  _onAssignmentExpression(node) {
    if (node.left.type !== 'MemberExpression' || node.right.type !== 'ObjectExpression')
      return;
    if (node.left.object.type !== 'Identifier' || node.left.property.type !== 'Identifier' || node.left.property.name !== 'Events')
      return;
    const className = node.left.object.name;
    let events = this._eventsByClassName.get(className);
    if (!events) {
      events = [];
      this._eventsByClassName.set(className, events);
    }
    for (let property of node.right.properties) {
      if (property.type !== 'Property' || property.key.type !== 'Identifier' || property.value.type !== 'Literal')
        continue;
      events.push(Documentation.Member.createEvent(property.value.value));
    }
  }

  _flushClassIfNeeded() {
    if (this._currentClassName === null)
      return;
    let jsClass = new Documentation.Class(this._currentClassName, this._currentClassMembers);
    this.classes.push(jsClass);
    this._currentClassName = null;
    this._currentClassMembers = [];
  }

  _recreateClassesWithEvents() {
    this.classes = this.classes.map(cls => {
      let events = this._eventsByClassName.get(cls.name) || [];
      let members = cls.membersArray.concat(events);
      return new Documentation.Class(cls.name, members);
    });
  }

  _extractText(node) {
    if (!node)
      return null;
    let text = this._text.substring(node.range[0], node.range[1]).trim();
    return text;
  }
}

/**
 * @param {!Array<string>} dirPath
 * @return {!Promise<{documentation: !Documentation, errors: !Array<string>}>}
 */
module.exports = async function(dirPath) {
  let filePaths = fs.readdirSync(dirPath)
      .filter(fileName => fileName.endsWith('.js'))
      .map(fileName => path.join(dirPath, fileName));
  let classes = [];
  let errors = [];
  for (let filePath of filePaths) {
    let outline = new JSOutline(fs.readFileSync(filePath, 'utf8'));
    classes.push(...outline.classes);
    errors.push(...outline.errors);
  }
  const documentation = new Documentation(classes);
  return { documentation, errors };
};

