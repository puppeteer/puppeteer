/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {ESLintUtils} from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(name => {
  return `https://github.com/puppeteer/puppeteer/tree/main/tools/eslint/${name}.js`;
});

const enforceExtensionRule = createRule<[], 'extensionsRule'>({
  name: 'extensions',
  meta: {
    docs: {
      description: 'Requires `.js` for imports',
      requiresTypeChecking: false,
    },
    messages: {
      extensionsRule: 'Add `.js` to import.',
    },
    schema: [],
    fixable: 'code',
    type: 'problem',
  },
  defaultOptions: [],
  create(context) {
    return {
      ImportDeclaration(node): void {
        const file = node.source.value.split('/').pop();

        if (!node.source.value.startsWith('.') || file?.includes('.')) {
          return;
        }
        context.report({
          node: node.source,
          messageId: 'extensionsRule',
          fix(fixer) {
            return fixer.replaceText(node.source, `'${node.source.value}.js'`);
          },
        });
      },
    };
  },
});

export = enforceExtensionRule;
