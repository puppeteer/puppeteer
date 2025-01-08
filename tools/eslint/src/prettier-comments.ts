/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import prettier from '@prettier/sync';
import {ESLintUtils} from '@typescript-eslint/utils';

const prettierConfigFile = prettier.resolveConfigFile(
  '../../../.prettierrc.cjs',
);
const prettierConfig = prettier.resolveConfig(prettierConfigFile ?? '');

const createRule = ESLintUtils.RuleCreator<{
  requiresTypeChecking: boolean;
}>(name => {
  return `https://github.com/puppeteer/puppeteer/tree/main/tools/eslint/${name}.js`;
});

const cleanupBlockComment = (value: string) => {
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

const format = (value: string, offset: number) => {
  return prettier
    .format(value, {
      ...prettierConfig,
      parser: 'markdown',
      // This is the print width minus 3 (the length of ` * `) and the offset.
      printWidth: 80 - (offset + 3),
    })
    .trim();
};

const buildBlockComment = (value: string, offset: number) => {
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

const prettierCommentsRule = createRule<[], 'prettierComments'>({
  name: 'prettier-comments',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce Prettier formatting on comments',
      requiresTypeChecking: false,
    },
    fixable: 'code',
    schema: [],
    messages: {
      prettierComments: 'Comment is not formatted correctly.',
    },
  },
  defaultOptions: [],
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
              messageId: 'prettierComments',
              fix(fixer) {
                return fixer.replaceText(
                  comment,
                  buildBlockComment(formattedValue, offset).trimStart(),
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
});

export = prettierCommentsRule;
