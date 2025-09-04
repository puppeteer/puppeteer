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
        'page.setContent() should wrap the HTML in html to prevent Quirk Mode activation. If you needed use htmlWithQuirks',
    },
    fixable: 'code',
    schema: [], // No options for this rule
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node) {
        const callee = node.callee;

        // 1. Check if the function being called is a MemberExpression
        // (e.g., object.method)
        if (callee.type !== 'MemberExpression') {
          return;
        }

        // 2. Check if the object is `page` and the method is `setContent`
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

        // At this point, we know we have a `page.setContent(...)` call.

        // 3. Check the first argument
        const firstArg = node.arguments[0];
        let isArgumentValid = false;

        if (firstArg) {
          // 4. Verify the argument is a TaggedTemplateExpression (e.g., tag`...`)
          if (firstArg.type === 'TaggedTemplateExpression') {
            const tag = firstArg.tag;
            // 5. Verify the tag is the `html` identifier
            if (
              tag.type === 'Identifier' &&
              (tag.name === 'html' || tag.name === 'htmlRaw')
            ) {
              isArgumentValid = true;
            }
          }
        }

        // 6. If the argument is not valid, report an error
        if (!isArgumentValid) {
          context.report({
            node: node, // Report the error on the entire call expression
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
                const stringContent = argToFix.value
                  .replace(/`/g, '\`')
                  .replace(/\$\{/g, '\${');

                return fixer.replaceText(argToFix, `html\`${stringContent}\``);
              }

              // Case 2: For all other types (variables, string literals, etc.),
              // we wrap the entire expression in `html`${...}``.
              const argText = context.sourceCode.getText(argToFix);
              return fixer.replaceText(argToFix, `html\`\${${argText}}\``);
            },
          });
        }
      },
    };
  },
});

export = noInvalidSetContentRule;
