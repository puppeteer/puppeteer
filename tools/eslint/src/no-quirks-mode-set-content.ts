/**
 * @license
 * Copyright 2025 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import {ESLintUtils} from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator<{
  requiresTypeChecking: boolean;
}>(name => {
  return `https://github.com/puppeteer/puppeteer/tree/main/tools/eslint/${name}.js`;
});

const noInvalidSetContentRule = createRule({
  name: 'no-quirks-mode-set-content',
  meta: {
    type: 'problem',
    docs: {
      requiresTypeChecking: false,
      description:
        'Enforce that page.setContent() is called with the html tagged template literal.',
    },
    messages: {
      missingHtml:
        'page.setContent() should not use Quirks mode, if needed use htmlRaw``',
    },
    fixable: 'code',
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node) {
        const callee = node.callee;

        if (callee.type !== 'MemberExpression') {
          return;
        }

        const object = callee.object;
        const property = callee.property;

        if (
          object.type !== 'Identifier' ||
          object.name !== 'page' ||
          property.type !== 'Identifier' ||
          property.name !== 'setContent'
        ) {
          return;
        }

        const firstArg = node.arguments[0];
        let isArgumentValid = false;

        if (firstArg) {
          if (firstArg.type === 'TaggedTemplateExpression') {
            const tag = firstArg.tag;
            if (
              tag.type === 'Identifier' &&
              (tag.name === 'html' || tag.name === 'htmlRaw')
            ) {
              isArgumentValid = true;
            }
          }
        }

        if (!isArgumentValid) {
          context.report({
            node: node,
            messageId: 'missingHtml',
            fix(fixer) {
              const argToFix = node.arguments[0];
              if (!argToFix) {
                return null;
              }

              if (argToFix.type === 'TemplateLiteral') {
                return fixer.insertTextBefore(argToFix, 'html');
              }

              if (
                argToFix.type === 'Literal' &&
                typeof argToFix.value === 'string'
              ) {
                return fixer.replaceText(argToFix, `html\`${argToFix.value}\``);
              }

              const argText = context.sourceCode.getText(argToFix);
              return fixer.replaceText(argToFix, `html\`\${${argText}}\``);
            },
          });
        }
      },
    };
  },
});

export default noInvalidSetContentRule;
