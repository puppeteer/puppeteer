const prettier = require('prettier');

const cleanupBlockComment = value => {
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

const format = (value, offset, prettierOptions) => {
  return prettier
    .format(value, {
      ...prettierOptions,
      // This is the print width minus 3 (the length of ` * `) and the offset.
      printWidth: prettierOptions.printWidth - (offset + 3),
    })
    .trim();
};

const buildBlockComment = (value, offset) => {
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

/**
 * @type import("eslint").Rule.RuleModule
 */
const rule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce Prettier formatting on comments',
      recommended: false,
    },
    fixable: 'code',
    schema: [],
    messages: {},
  },

  create(context) {
    const prettierOptions = {
      printWidth: 80,
      ...prettier.resolveConfig.sync(context.getPhysicalFilename()),
      parser: 'markdown',
    };
    for (const comment of context.getSourceCode().getAllComments()) {
      switch (comment.type) {
        case 'Block': {
          const offset = comment.loc.start.column;
          const value = cleanupBlockComment(comment.value);
          const formattedValue = format(value, offset, prettierOptions);
          if (formattedValue !== value) {
            context.report({
              node: comment,
              message: `Comment is not formatted correctly.`,
              fix(fixer) {
                return fixer.replaceText(
                  comment,
                  buildBlockComment(formattedValue, offset).trimStart()
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
};

module.exports = {
  rules: {
    'prettier-comments': rule,
  },
};
