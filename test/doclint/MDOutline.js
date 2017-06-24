const Documentation = require('./Documentation');
const marked = require('marked');

class MDOutline {
  constructor(text) {
    this.classes = [];
    this.ast = buildAST(text);

    const classHeading = /^class: (\w+)$/;
    const constructorRegex = /^new (\w+)\((.*)\)$/;
    const methodRegex = /^(\w+)\.(\w+)\((.*)\)$/;
    let currentClassName = null;
    let currentClassMethods = [];
    for (let token of this.ast) {
      if (token.type === 'section' && classHeading.test(token.title)) {
        let match = token.title.match(classHeading);
        flushClassIfNeeded.call(this);
        currentClassName = match[1];
      } else if (token.type === 'section') {
        let className = null;
        let methodName = null;
        if (constructorRegex.test(token.title)) {
          let match = token.title.match(constructorRegex);
          className = match[1];
          methodName = 'constructor';
        } else if (methodRegex.test(token.title)) {
          let match = token.title.match(methodRegex);
          className = match[1];
          methodName = match[2];
        } else {
          // The section doesn't describe method or constructor.
          continue;
        }
        if (!currentClassName || !className || !methodName || className.toLowerCase() !== currentClassName.toLowerCase()) {
          console.warn('failed to process header as method: ' + token.title);
          continue;
        }
        let method = new Documentation.Method(methodName);
        currentClassMethods.push(method);
      }
    }
    flushClassIfNeeded.call(this);

    function flushClassIfNeeded() {
      if (currentClassName === null)
        return;
      this.classes.push(new Documentation.Class(currentClassName, currentClassMethods));
      currentClassName = null;
      currentClassMethods = [];
    }
  }
}

function buildAST(text) {
  let lexer = new marked.Lexer({
    gfm: true,
    tables: true,
    breaks: false,
    pedantic: false,
    sanitize: false,
    smartLists: true,
    smartypants: true
  });
  let tokens = lexer.lex(text);
  let root = [];
  let containerStack = [root];
  // Convert a sequence of tokens into nested lists.
  for (let token of tokens) {
    let container = containerStack[containerStack.length - 1];
    if (!token.type.startsWith('list')) {
      container.push(token);
      continue;
    }
    if (token.type === 'list_start') {
      let list = {
        type: 'list',
        items: [],
      };
      container.push(list);
      containerStack.push(list.items);
    } else if (token.type === 'list_end') {
      containerStack.pop();
    } else if (token.type === 'list_item_start') {
      let item = {
        type: 'list_item',
        body: []
      };
      container.push(item);
      containerStack.push(item.body);
    } else if (token.type === 'list_item_end') {
      containerStack.pop();
    }
  }
  // Convert headers into sections.
  let result = [];
  let activeSection = null;
  for (let token of root) {
    if (token.type !== 'heading') {
      if (activeSection)
        activeSection.body.push(token);
      else
        result.push(token);
      continue;
    }
    let section = {
      type: 'section',
      title: token.text,
      body: [],
    };
    result.push(section);
    activeSection = section;
  }
  return result;
}

module.exports = MDOutline;
