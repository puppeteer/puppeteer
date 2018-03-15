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
const ESTreeWalker = require('../ESTreeWalker');

// This is converted from Babel's "transform-async-to-generator"
// https://babeljs.io/docs/plugins/transform-async-to-generator/
const asyncToGenerator = fn => {
  const gen = fn.call(this);
  return new Promise((resolve, reject) => {
    function step(key, arg) {
      let info, value;
      try {
        info = gen[key](arg);
        value = info.value;
      } catch (error) {
        reject(error);
        return;
      }
      if (info.done) {
        resolve(value);
      } else {
        return Promise.resolve(value).then(
            value => {
              step('next', value);
            },
            err => {
              step('throw', err);
            });
      }
    }
    return step('next');
  });
};

/**
 * @param {string} text
 * @return {string}
 */
function transformAsyncFunctions(text) {
  /**
   * @type {!Array<{from: number, to: number, replacement: string}>}
   */
  const edits = [];

  const ast = esprima.parseScript(text, {range: true, tolerant: true});
  const walker = new ESTreeWalker(node => {
    if (node.type === 'FunctionExpression' || node.type === 'FunctionDeclaration' || node.type === 'ArrowFunctionExpression')
      onBeforeFunction(node);
    else if (node.type === 'AwaitExpression')
      onBeforeAwait(node);
  }, node => {
    if (node.type === 'FunctionExpression' || node.type === 'FunctionDeclaration' || node.type === 'ArrowFunctionExpression')
      onAfterFunction(node);
    else if (node.type === 'AwaitExpression')
      onAfterAwait(node);
  });
  walker.walk(ast);

  edits.reverse();
  for (const {replacement, from, to} of edits)
    text = text.substring(0, from) + replacement + text.substring(to);

  return text;

  /**
   * @param {ESTree.Node} node
   */
  function onBeforeFunction(node) {
    if (!node.async) return;

    let range;
    if (node.parent.type === 'MethodDefinition')
      range = node.parent.range;
    else
      range = node.range;
    const index = text.substring(range[0], range[1]).indexOf('async') + range[0];
    insertText(index, index + 'async'.length, '/* async */');

    let before = `{return (${asyncToGenerator.toString()})(function*()`;
    if (node.body.type !== 'BlockStatement') {
      before += `{ return `;

      // Remove parentheses that might wrap an arrow function
      const beforeBody = text.substring(node.range[0], node.body.range[0]);
      if (/\(\s*$/.test(beforeBody)) {
        const openParen = node.range[0] + beforeBody.lastIndexOf('(');
        insertText(openParen, openParen + 1, ' ');
      }
    }


    insertText(node.body.range[0], node.body.range[0], before);
  }

  /**
   * @param {ESTree.Node} node
   */
  function onAfterFunction(node) {
    if (!node.async) return;

    let after = `);}`;
    if (node.body.type !== 'BlockStatement')
      after = `; }` + after;
    insertText(node.body.range[1], node.body.range[1], after);

    if (node.body.type !== 'BlockStatement') {
      // Remove parentheses that might wrap an arrow function
      const beforeBody = text.substring(node.range[0], node.body.range[0]);
      if (/\(\s*$/.test(beforeBody)) {
        const afterBody = text.substring(node.body.range[1], node.range[1]);
        const closeParen = node.body.range[1] + afterBody.indexOf(')');
        insertText(closeParen, closeParen + 1, ' ');
      }
    }
  }

  /**
   * @param {ESTree.Node} node
   */
  function onBeforeAwait(node) {
    const index = text.substring(node.range[0], node.range[1]).indexOf('await') + node.range[0];
    insertText(index, index + 'await'.length, '(yield');
  }

  /**
   * @param {ESTree.Node} node
   */
  function onAfterAwait(node) {
    insertText(node.range[1], node.range[1], ')');
  }

  /**
   * @param {number} from
   * @param {number} to
   */
  function insertText(from, to, replacement) {
    edits.push({from, to, replacement});
  }
}

module.exports = transformAsyncFunctions;