const esprima = require('esprima');
const ESTreeWalker = require('./ESTreeWalker');
const Documentation = require('./Documentation');

class JSOutline {
  constructor(text) {
    this.classes = [];
    this._currentClassName = null;
    this._currentClassMethods = [];

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
    this._currentClassName = this._getIdentifier(node.id);
  }

  _onMethodDefinition(node) {
    console.assert(this._currentClassName !== null);
    let methodName = this._getIdentifier(node.key);
    let method = new Documentation.Method(methodName);
    this._currentClassMethods.push(method);
  }

  _flushClassIfNeeded() {
    if (this._currentClassName === null)
      return;
    let jsClass = new Documentation.Class(this._currentClassName, this._currentClassMethods);
    this.classes.push(jsClass);
    this._currentClassName = null;
    this._currentClassMethods = [];
  }

  _getIdentifier(node) {
    if (!node)
      return null;
    let text = this._text.substring(node.range[0], node.range[1]).trim();
    return /^[$A-Z_][0-9A-Z_$]*$/i.test(text) ? text : null;
  }
}

module.exports = JSOutline;
