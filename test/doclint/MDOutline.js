const Documentation = require('./Documentation');
const commonmark = require('commonmark');
const Browser = require('../../lib/Browser');

class MDOutline {
  constructor(text) {
    this.classes = [];
    this.html = MDOutline.compile(text);
  }

  static compile(text) {
    const reader = new commonmark.Parser();
    const writer = new commonmark.HtmlRenderer();
    const parsed = reader.parse(text);
    return writer.render(parsed);
  }

  async collectHeadings() {
    const browser = new Browser({args: ['--no-sandbox']});
    const page = await browser.newPage();
    await page.setContent(this.html);
    this.headings = await page.evaluate(getTOCHeadings);
    await browser.close();
  }

  buildClasses() {
    const headings = this.headings;
    const classHeading = /^class: (\w+)$/;
    const constructorRegex = /^new (\w+)\((.*)\)$/;
    const methodRegex = /^(\w+)\.(\w+)\((.*)\)$/;
    let currentClassName = null;
    let currentClassMethods = [];
    for (const heading of Object.keys(headings)) {

      let match = heading.match(classHeading);
      currentClassName = match[1];
      for (const title of headings[heading]) {
        let className = null;
        let methodName = null;
        if (constructorRegex.test(title)) {
          let match = title.match(constructorRegex);
          className = match[1];
          methodName = 'constructor';
        } else if (methodRegex.test(title)) {
          let match = title.match(methodRegex);
          className = match[1];
          methodName = match[2];
        }

        if (!currentClassName || !className || !methodName || className.toLowerCase() !== currentClassName.toLowerCase()) {
          console.warn('failed to process header as method: ' + heading);
          continue;
        }
        let method = new Documentation.Method(methodName);
        currentClassMethods.push(method);
      }
      flushClassIfNeeded.call(this);
    }

    function flushClassIfNeeded() {
      if (currentClassName === null)
        return;
      this.classes.push(new Documentation.Class(currentClassName, currentClassMethods));
      currentClassName = null;
      currentClassMethods = [];
    }
  }
}

function getTOCHeadings(){
  const headings = {};
  document.querySelectorAll('h3').forEach((domainEl, i) => {
    const methods = [];
    let currElem = domainEl;
    while ((currElem = currElem.nextElementSibling) && !currElem.matches('h3')) {
      if (currElem.matches('h4'))
        methods.push(currElem.textContent);
    }
    headings[domainEl.textContent] = methods;
  });
  return headings;
}

module.exports = MDOutline;
