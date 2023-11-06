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
