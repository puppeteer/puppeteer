/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {ESLintUtils} from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(name => {
  return `https://github.com/puppeteer/puppeteer/tree/main/tools/eslint/${name}.js`;
});

const copyrightPattern = /Copyright ([0-9]{4}) Google Inc\./;

const enforceLicenseRule = createRule<[], 'licenseRule'>({
  name: 'license',
  meta: {
    type: 'layout',
    docs: {
      description: 'Validate existence of license header',
      requiresTypeChecking: false,
    },
    fixable: 'code',
    schema: [],
    messages: {
      licenseRule: 'Add license header.',
    },
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode;
    const comments = sourceCode.getAllComments();
    const header =
      comments[0]?.type === 'Block' && isHeaderComment(comments[0])
        ? comments[0]
        : null;

    function isHeaderComment(comment: any) {
      if (comment?.range[0] >= 0 && comment?.range[1] <= 88) {
        return true;
      } else {
        return false;
      }
    }

    return {
      Program(node) {
        if (
          header?.value.includes('@license') &&
          header?.value.includes('SPDX-License-Identifier: Apache-2.0') &&
          copyrightPattern.test(header?.value)
        ) {
          return;
        }

        // Add header license
        if (!header || !header.value.includes('@license')) {
          context.report({
            node: node,
            messageId: 'licenseRule',
          });
        }
      },
    };
  },
});

module.exports = enforceLicenseRule;
