const fs = require('fs');
const path = require('path');
const esprima = require('esprima');
const ESTreeWalker = require('../../third_party/chromium/ESTreeWalker');
const Documentation = require('./Documentation');

class JSOutline {
  constructor(text) {
    this.classes = [];
    this._currentClassName = null;
    this._currentClassMethods = [];
    this._currentClassProperties = [];

    this._text = text;
    let ast = esprima.parseScript(this._text, {loc: true, range: true});
    let walker = new ESTreeWalker(node => {
      if (node.type === 'ClassDeclaration')
        this._onClassDeclaration(node);
      else if (node.type === 'MethodDefinition')
        this._onMethodDefinition(node);
    });
    walker.walk(ast);
    this._flushClassIfNeeded();
  }

  _onClassDeclaration(node) {
    this._flushClassIfNeeded();
    this._currentClassName = this._extractText(node.id);
  }

  _onMethodDefinition(node) {
    console.assert(this._currentClassName !== null);
    console.assert(node.value.type === 'FunctionExpression');
    const args = [];
    for (let param of node.value.params)
      args.push(new Documentation.Argument(this._extractText(param)));
    let methodName = this._extractText(node.key);
    let method = new Documentation.Method(methodName, args);
    this._currentClassMethods.push(method);
    // Extract properties from constructor.
    if (node.kind === 'constructor') {
      let walker = new ESTreeWalker(node => {
        if (node.type !== 'AssignmentExpression')
          return;
        node = node.left;
        if (node.type === 'MemberExpression' && node.object &&
            node.object.type === 'ThisExpression' && node.property &&
            node.property.type === 'Identifier')
          this._currentClassProperties.push(node.property.name);
      });
      walker.walk(node);
    }
    return ESTreeWalker.SkipSubtree;
  }

  _onMemberExpression(node) {

  }

  _flushClassIfNeeded() {
    if (this._currentClassName === null)
      return;
    let jsClass = new Documentation.Class(this._currentClassName, this._currentClassMethods, this._currentClassProperties);
    this.classes.push(jsClass);
    this._currentClassName = null;
    this._currentClassMethods = [];
    this._currentClassProperties = [];
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
 * @return {!Promise<!Documentation>}
 */
module.exports = async function(dirPath) {
  let filePaths = fs.readdirSync(dirPath)
      .filter(fileName => fileName.endsWith('.js'))
      .map(fileName => path.join(dirPath, fileName));
  let classes = [];
  for (let filePath of filePaths) {
    let outline = new JSOutline(fs.readFileSync(filePath, 'utf8'));
    classes.push(...outline.classes);
  }
  return new Documentation(classes);
};

