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

import {ESLintUtils, TSESTree} from '@typescript-eslint/utils';

const usingSymbols = ['ElementHandle', 'JSHandle'];

const createRule = ESLintUtils.RuleCreator(name => {
  return `https://github.com/puppeteer/puppeteer/tree/main/tools/eslint/${name}.js`;
});

const useUsingRule = createRule<[], 'useUsing' | 'useUsingFix'>({
  name: 'use-using',
  meta: {
    docs: {
      description: "Requires 'using' for element/JS handles.",
      requiresTypeChecking: true,
    },
    hasSuggestions: true,
    messages: {
      useUsing: "Use 'using'.",
      useUsingFix: "Replace with 'using' to ignore.",
    },
    schema: [],
    type: 'problem',
  },
  defaultOptions: [],
  create(context) {
    const services = ESLintUtils.getParserServices(context);
    const checker = services.program.getTypeChecker();

    return {
      VariableDeclaration(node): void {
        if (['using', 'await using'].includes(node.kind) || node.declare) {
          return;
        }
        for (const declaration of node.declarations) {
          if (declaration.id.type === TSESTree.AST_NODE_TYPES.Identifier) {
            const tsNode = services.esTreeNodeToTSNodeMap.get(declaration.id);
            const type = checker.getTypeAtLocation(tsNode);
            let isElementHandleReference = false;
            if (type.isUnionOrIntersection()) {
              for (const member of type.types) {
                if (
                  member.symbol !== undefined &&
                  usingSymbols.includes(member.symbol.escapedName as string)
                ) {
                  isElementHandleReference = true;
                  break;
                }
              }
            } else {
              isElementHandleReference =
                type.symbol !== undefined
                  ? usingSymbols.includes(type.symbol.escapedName as string)
                  : false;
            }
            if (isElementHandleReference) {
              context.report({
                node: declaration.id,
                messageId: 'useUsing',
                suggest: [
                  {
                    messageId: 'useUsingFix',
                    fix(fixer) {
                      return fixer.replaceTextRange(
                        [node.range[0], node.range[0] + node.kind.length],
                        'using'
                      );
                    },
                  },
                ],
              });
            }
          }
        }
      },
    };
  },
});

export = useUsingRule;
