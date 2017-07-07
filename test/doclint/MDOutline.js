const Documentation = require('./Documentation');
const commonmark = require('commonmark');
const Browser = require('../../lib/Browser');

class MDOutline {
  /**
   * @return {!MDOutline}
   */
  static async create(text) {
    // Render markdown as HTML.
    const reader = new commonmark.Parser();
    const parsed = reader.parse(text);
    const writer = new commonmark.HtmlRenderer();
    const html = writer.render(parsed);

    // Extract headings.
    const browser = new Browser({args: ['--no-sandbox']});
    const page = await browser.newPage();
    await page.setContent(html);
    const headings = await page.evaluate(() => {
      let headings = {};
      let methods = [];
      for (let header of document.body.querySelectorAll('h3,h4')) {
        if (header.matches('h3')) {
          methods = [];
          headings[header.textContent] = methods;
        } else {
          methods.push(header.textContent);
        }
      }
      return headings;
    });
    await browser.close();
    return new MDOutline(headings);
  }

  constructor(headings) {
    this.classes = [];
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

module.exports = MDOutline;
