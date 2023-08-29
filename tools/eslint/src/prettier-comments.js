/**
 * Copyright 2023 Google Inc. All rights reserved.
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

// @ts-nocheck
// TODO: We should convert this to types.

const prettier = require('@prettier/sync');

const prettierConfigPath = '../../../.prettierrc.cjs';
const prettierConfig = require(prettierConfigPath);

const cleanupBlockComment = value => {
  return value
    .trim()
    .split('\n')
    .map(value => {
      value = value.trim();
      if (value.startsWith('*')) {
        value = value.slice(1);
        if (value.startsWith(' ')) {
          value = value.slice(1);
        }
      }
      return value.trimEnd();
    })
    .join('\n')
    .trim();
};

const format = (value, offset) => {
  return prettier
    .format(value, {
      ...prettierConfig,
      parser: 'markdown',
      // This is the print width minus 3 (the length of ` * `) and the offset.
      printWidth: 80 - (offset + 3),
    })
    .trim();
};

const buildBlockComment = (value, offset) => {
  const spaces = ' '.repeat(offset);
  const lines = value.split('\n').map(line => {
    return ` * ${line}`;
  });
  lines.unshift('/**');
  lines.push(' */');
  lines.forEach((line, i) => {
    lines[i] = `${spaces}${line}`;
  });
  return lines.join('\n');
};

/**
 * @type import("eslint").Rule.RuleModule
 */
const prettierCommentsRule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce Prettier formatting on comments',
      recommended: false,
    },
    fixable: 'code',
    schema: [],
    messages: {},
  },

  create(context) {
    for (const comment of context.sourceCode.getAllComments()) {
      switch (comment.type) {
        case 'Block': {
          const offset = comment.loc.start.column;
          const value = cleanupBlockComment(comment.value);
          const formattedValue = format(value, offset);
          if (formattedValue !== value) {
            context.report({
              node: comment,
              message: `Comment is not formatted correctly.`,
              fix(fixer) {
                return fixer.replaceText(
                  comment,
                  buildBlockComment(formattedValue, offset).trimStart()
                );
              },
            });
          }
          break;
        }
      }
    }
    return {};
  },
};

module.exports = prettierCommentsRule;
