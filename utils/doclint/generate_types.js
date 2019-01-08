const path = require('path');
const Source = require('./Source');
const puppeteer = require('../..');
const PROJECT_DIR = path.join(__dirname, '..', '..');
const fs = require('fs');
(async function() {
  const browser = await puppeteer.launch();
  const page = (await browser.pages())[0];
  const api = await Source.readFile(path.join(PROJECT_DIR, 'docs', 'api.md'));
  const {documentation} = await require('./check_public_api/MDBuilder')(page, [api]);
  await browser.close();
  const classes = documentation.classesArray.slice(1);
  const root = documentation.classesArray[0];
  const output = `// This is generated from /utils/protocol-types-generator/index.js
import { ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
export interface Serializable {}

${root.membersArray.map(member => `
${memberJSDOC(member, '')}export function ${member.name}${argsFromMember(member)} : ${typeToString(member.type)};
`).join('')}

${classes.map(classDesc => `
/**
 * ${classDesc.comment.split('\n').join('\n * ')}
 */
export interface ${classDesc.name} ${classDesc.extends ? `extends ${classDesc.extends} ` : ''}{${classDesc.membersArray.map(member => `
  ${memberJSDOC(member, '  ')}${member.name}${argsFromMember(member)}: ${typeToString(member.type)};`).join('\n')}
}
`).join('')}
`;
  fs.writeFileSync(path.join(__dirname, '..', '..', 'index.d.ts'), output, 'utf8');
})();


/**
 * @param {import('./check_public_api/Documentation').Type} type
 */
function typeToString(type) {
  if (!type)
    return 'void';
  let typeString = stringifyType(parseType(type.name));
  for (let i = 0; i < type.properties.length; i++)
    typeString = typeString.replace('arg' + i, type.properties[i].name);
  return typeString;
}

/**
 * @param {string} type
 */
function parseType(type) {
  type = type.trim();
  if (type.startsWith('?')) {
    const parsed = parseType(type.substring(1));
    parsed.nullable = true;
    return parsed;
  }
  if (type.startsWith('...'))
    return parseType('Array<' + type.substring(3) + '>');
  let name = type;
  let next = null;
  let template = null;
  let args = null;
  let retType = null;
  let firstTypeLength = type.length;
  for (let i = 0; i < type.length; i++) {
    if (type[i] === '<') {
      name = type.substring(0, i);
      const matching = matchingBracket(type.substring(i), '<', '>');
      template = parseType(type.substring(i + 1, i + matching - 1));
      firstTypeLength = i + matching;
      break;
    }
    if (type[i] === '(') {
      name = type.substring(0, i);
      const matching = matchingBracket(type.substring(i), '(', ')');
      args = parseType(type.substring(i + 1, i + matching - 1));
      i = i + matching;
      if (type[i] === ':') {
        retType = parseType(type.substring(i + 1));
        next = retType.next;
        retType.next = null;
        break;
      }
    }
    if (type[i] === '|' || type[i] === ',') {
      name = type.substring(0, i);
      firstTypeLength = i;
      break;
    }
  }
  let pipe = null;
  if (type[firstTypeLength] === '|')
    pipe = parseType(type.substring(firstTypeLength + 1));
  else if (type[firstTypeLength] === ',')
    next = parseType(type.substring(firstTypeLength + 1));
  if (name === 'Promise' && !template)
    template = parseType('void');
  return {
    name,
    args,
    retType,
    template,
    pipe,
    next
  };
}

function stringifyType(parsedType) {
  if (!parsedType)
    return 'void';
  let out = parsedType.name;
  if (parsedType.args) {
    let args = parsedType.args;
    const stringArgs = [];
    while (args) {
      const arg = args;
      args = args.next;
      arg.next = null;
      stringArgs.push(stringifyType(arg));
    }
    out = `(${stringArgs.map((type, index) => `arg${index} : ${type}`).join(', ')}) => ${stringifyType(parsedType.retType)}`;
  } else if (parsedType.name === 'function') {
    return 'Function';
  }
  if (parsedType.nullable)
    out = 'null|' + out;
  if (parsedType.template)
    out += '<' + stringifyType(parsedType.template) + '>';
  if (parsedType.pipe)
    out += '|' + stringifyType(parsedType.pipe);
  if (parsedType.next)
    out += ', ' + stringifyType(parsedType.next);
  return out.trim();
}

function matchingBracket(str, open, close) {
  let count = 1;
  let i = 1;
  for (; i < str.length && count; i++) {
    if (str[i] === open)
      count++;
    else if (str[i] === close)
      count--;
  }
  return i;
}

/**
 * @param {import('./check_public_api/Documentation').Member} member
 */
function argsFromMember(member) {
  if (member.kind === 'property')
    return '';
  return '(' + member.argsArray.map(arg => `${arg.name}: ${typeToString(arg.type)}`).join(', ') + ')';
}
/**
 * @param {import('./check_public_api/Documentation').Member} member
 */
function memberJSDOC(member, indent) {
  const lines = [];
  if (member.comment)
    lines.push(...member.comment.split('\n'));
  lines.push(...member.argsArray.map(arg => `@param ${arg.name.replace(/\./g, '')} ${arg.comment.replace('\n', ' ')}`));
  if (member.returnComment)
    lines.push(`@returns ${member.returnComment}`);
  if (!lines.length)
    return '';
  return `/**
${indent} * ${lines.join('\n' + indent + ' * ')}
${indent} */
${indent}`;
}