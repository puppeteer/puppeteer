/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

const licenseHeader = `/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */\n\n`;

/**
 * @type import("eslint").Rule.RuleModule
 */

const enforceLicenseRule = {
// module.exports = {
  meta: {
    type: 'layout',
    docs: {
      description: 'Validate existence of license header',
    },
    fixable: 'code',
    schema: [],
    messages: {
      licenseRule: 'Add license header.',
    },
  },
  create(context) {
    const sourceCode = context.sourceCode;
    const comments = sourceCode.getAllComments();
    const header = comments[0];

    return {
      Program(node) {
        if (header?.value.includes('@license')) {
          return;
        }

        // Add header license
        if (!header) {
          context.report({
            node: node,
            messageId: 'licenseRule',
            fix(fixer) {
              return fixer.insertTextBefore(node, licenseHeader);
            },
          });
        }
        // Header exists, but is not license.
        if (header && !header.value.includes('@license')) {
          context.report({
            node: node,
            messageId: 'licenseRule',
            fix(fixer) {
              return fixer.insertTextBeforeRange(
                [header.range[0], header.range[1]],
                licenseHeader
              );
            },
          });
        }
      },
    };
  },
};

module.exports = enforceLicenseRule;
