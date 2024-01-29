/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type {TSESTree} from '@typescript-eslint/utils';
import {ESLintUtils} from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(name => {
  return `https://github.com/puppeteer/puppeteer/tree/main/tools/eslint/${name}.ts`;
});

const copyrightPattern = /Copyright ([0-9]{4}) Google Inc\./;

// const currentYear = new Date().getFullYear;

// const licenseHeader = `/**
//  * @license
//  * Copyright ${currentYear} Google Inc.
//  * SPDX-License-Identifier: Apache-2.0
//  */`;

const enforceLicenseRule = createRule<[], 'licenseRule'>({
  name: 'check-license',
  meta: {
    type: 'layout',
    docs: {
      description: 'Validate existence of license header',
      requiresTypeChecking: false,
    },
    fixable: undefined, // TODO: change to 'code' once fixer works.
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

    function isHeaderComment(comment: TSESTree.Comment) {
      if (comment && comment.range[0] >= 0 && comment.range[1] <= 88) {
        return true;
      } else {
        return false;
      }
    }

    return {
      Program(node) {
        if (
          header &&
          header.value.includes('@license') &&
          header.value.includes('SPDX-License-Identifier: Apache-2.0') &&
          copyrightPattern.test(header.value)
        ) {
          return;
        }

        // Add header license
        if (!header || !header.value.includes('@license')) {
          // const startLoc: [number, number] = [0, 88];
          context.report({
            node: node,
            messageId: 'licenseRule',
            // TODO: fix the fixer.
            // fix(fixer) {
            //   return fixer.insertTextBeforeRange(startLoc, licenseHeader);
            // },
          });
        }
      },
    };
  },
});

export = enforceLicenseRule;
