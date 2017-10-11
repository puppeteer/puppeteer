/**
 * Copyright 2017 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const esprima = require('esprima');
const ESTreeWalker = require('../../ESTreeWalker');
const Documentation = require('./Documentation');

class JSOutline {
  constructor(text) {
    this.classes = [];
    /** @type {!Map<string, string>} */
    this.inheritance = new Map();
    this.errors = [];
    this._eventsByClassName = new Map();
    this._currentClassName = null;
    this._currentClassMembers = [];

    this._text = text;
    const ast = esprima.parseScript(this._text, {loc: true, range: true});
    const walker = new ESTreeWalker(node => {
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
    const superClass = this._extractText(node.superClass);
    if (superClass)
      this.inheritance.set(this._currentClassName, superClass);
  }

  _onMethodDefinition(node) {
    console.assert(this._currentClassName !== null);
    console.assert(node.value.type === 'FunctionExpression');
    const methodName = this._extractText(node.key);
    if (node.kind === 'get') {
      const property = Documentation.Member.createProperty(methodName);
      this._currentClassMembers.push(property);
      return;
    }
    // Async functions have return value.
    let hasReturn = node.value.async;
    // Extract properties from constructor.
    if (node.kind === 'constructor') {
      // Extract properties from constructor.
      const walker = new ESTreeWalker(node => {
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
      const walker = new ESTreeWalker(node => {
        if (node.type === 'FunctionExpression' || node.type === 'FunctionDeclaration' || node.type === 'ArrowFunctionExpression')
          return ESTreeWalker.SkipSubtree;
        if (node.type === 'ReturnStatement')
          hasReturn = hasReturn || !!node.argument;
      });
      walker.walk(node.value.body);
    }
    const args = [];
    for (const param of node.value.params) {
      if (param.type === 'AssignmentPattern' && param.left.name)
        args.push(new Documentation.Argument(param.left.name));
      else if (param.type === 'RestElement')
        args.push(new Documentation.Argument('...' + param.argument.name));
      else if (param.type === 'Identifier')
        args.push(new Documentation.Argument(param.name));
      else if (param.type === 'ObjectPattern' || param.type === 'AssignmentPattern')
        args.push(new Documentation.Argument('options'));
      else
        this.errors.push(`JS Parsing issue: unsupported syntax to define parameter in ${this._currentClassName}.${methodName}(): ${this._extractText(param)}`);
    }
    const method = Documentation.Member.createMethod(methodName, args, hasReturn, node.value.async);
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
    for (const property of node.right.properties) {
      if (property.type !== 'Property' || property.key.type !== 'Identifier' || property.value.type !== 'Literal')
        continue;
      events.push(Documentation.Member.createEvent(property.value.value));
    }
  }

  _flushClassIfNeeded() {
    if (this._currentClassName === null)
      return;
    const jsClass = new Documentation.Class(this._currentClassName, this._currentClassMembers);
    this.classes.push(jsClass);
    this._currentClassName = null;
    this._currentClassMembers = [];
  }

  _recreateClassesWithEvents() {
    this.classes = this.classes.map(cls => {
      const events = this._eventsByClassName.get(cls.name) || [];
      const members = cls.membersArray.concat(events);
      return new Documentation.Class(cls.name, members);
    });
  }

  _extractText(node) {
    if (!node)
      return null;
    const text = this._text.substring(node.range[0], node.range[1]).trim();
    return text;
  }
}

/**
 * @param {!Array<!Documentation.Class>} classes
 * @param {!Map<string, string>} inheritance
 * @return {!Array<!Documentation.Class>}
 */
function recreateClassesWithInheritance(classes, inheritance) {
  const classesByName = new Map(classes.map(cls => [cls.name, cls]));
  return classes.map(cls => {
    const membersMap = new Map();
    for (let wp = cls; wp; wp = classesByName.get(inheritance.get(wp.name))) {
      for (const member of wp.membersArray) {
        // Member was overridden.
        const memberId = member.type + ':' + member.name;
        if (membersMap.has(memberId))
          continue;
        // Do not inherit constructors
        if (wp !== cls && member.name === 'constructor' && member.type === 'method')
          continue;
        membersMap.set(memberId, member);
      }
    }
    return new Documentation.Class(cls.name, Array.from(membersMap.values()));
  });
}

/**
 * @param {!Array<!Source>} sources
 * @return {!Promise<{documentation: !Documentation, errors: !Array<string>}>}
 */
module.exports = async function(sources) {
  const classes = [];
  const errors = [];
  const inheritance = new Map();
  for (const source of sources) {
    const outline = new JSOutline(source.text());
    classes.push(...outline.classes);
    errors.push(...outline.errors);
    for (const entry of outline.inheritance)
      inheritance.set(entry[0], entry[1]);
  }
  const documentation = new Documentation(recreateClassesWithInheritance(classes, inheritance));
  return { documentation, errors };
};

