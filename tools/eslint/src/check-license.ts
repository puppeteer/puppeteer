/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type {TSESTree} from '@typescript-eslint/utils';
import {ESLintUtils} from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator<{
  requiresTypeChecking: boolean;
}>(name => {
  return `https://github.com/puppeteer/puppeteer/tree/main/tools/eslint/${name}.ts`;
});

const currentYear = new Date().getFullYear();

// Needs to start and end with new line
const licenseHeader = `
/**
 * @license
 * Copyright ${currentYear} Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
`;

const enforceLicenseRule = createRule<[], 'licenseRule'>({
  name: 'check-license',
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
    let insertAfter = [0, 0] as TSESTree.Range;
    let header: TSESTree.Comment | null = null;
    // Check only the first 2 comments
    for (let index = 0; index < 2; index++) {
      const comment = comments[index];
      if (!comment) {
        break;
      }
      // Shebang comments should be at the top
      if (
        // Types don't have it debugger showed it...
        (comment.type as string) === 'Shebang' ||
        (comment.type === 'Line' && comment.value.startsWith('#!'))
      ) {
        insertAfter = comment.range;
        continue;
      }
      if (comment.type === 'Block') {
        header = comment;
        break;
      }
    }

    return {
      Program(node) {
        if (context.filename.endsWith('.json')) {
          return;
        }

        if (
          header &&
          (header.value.includes('@license') ||
            header.value.includes('License') ||
            header.value.includes('Copyright'))
        ) {
          return;
        }

        // Add header license
        if (!header || !header.value.includes('@license')) {
          context.report({
            node: node,
            messageId: 'licenseRule',
            fix(fixer) {
              return fixer.insertTextAfterRange(insertAfter, licenseHeader);
            },
          });
        }
      },
    };
  },
});

export = enforceLicenseRule;
