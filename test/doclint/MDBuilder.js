const fs = require('fs');
const markdownToc = require('markdown-toc');
const path = require('path');
const Documentation = require('./Documentation');
const commonmark = require('commonmark');
const Browser = require('../../lib/Browser');

class MDOutline {
  /**
   * @param {!Browser} browser
   * @param {string} text
   * @return {!MDOutline}
   */
  static async create(browser, text) {
    // Render markdown as HTML.
    const reader = new commonmark.Parser();
    const parsed = reader.parse(text);
    const writer = new commonmark.HtmlRenderer();
    const html = writer.render(parsed);

    // Extract headings.
    const page = await browser.newPage();
    await page.setContent(html);
    const classes = await page.evaluate(() => {
      let classes = [];
      let currentClass = {};
      let method = {};
      for (let element of document.body.querySelectorAll('h3, h4, h4 + ul > li')) {
        if (element.matches('h3')) {
          currentClass = {
            name: element.textContent,
            methods: [],
          };
          classes.push(currentClass);
        } else if (element.matches('h4')) {
          method = {
            name: element.textContent,
            args: []
          };
          currentClass.methods.push(method);
        } else if (element.matches('li') && element.firstChild.matches && element.firstChild.matches('code')) {
          method.args.push(element.firstChild.textContent);
        }
      }
      return classes;
    });
    return new MDOutline(classes);
  }

  constructor(classes) {
    this.classes = [];
    this.errors = [];
    const classHeading = /^class: (\w+)$/;
    const constructorRegex = /^new (\w+)\((.*)\)$/;
    const methodRegex = /^(\w+)\.(\w+)\((.*)\)$/;
    let currentClassName = null;
    let currentClassMethods = [];
    for (const cls of classes) {
      let match = cls.name.match(classHeading);
      currentClassName = match[1];
      for (let mdMethod of cls.methods) {
        let className = null;
        let methodName = null;
        let parameters = null;
        let title = mdMethod.name;
        if (constructorRegex.test(title)) {
          let match = title.match(constructorRegex);
          className = match[1];
          parameters = match[2];
          methodName = 'constructor';
        } else if (methodRegex.test(title)) {
          let match = title.match(methodRegex);
          className = match[1];
          methodName = match[2];
          parameters = match[3];
        }

        if (!currentClassName || !className || !methodName || className.toLowerCase() !== currentClassName.toLowerCase()) {
          console.warn('failed to process header as method: ' + mdMethod.name);
          continue;
        }
        parameters = parameters.trim().replace(/[\[\]]/g, '');
        if (parameters !== mdMethod.args.join(', '))
          this.errors.push(`Heading arguments for "${mdMethod.name}" do not match described ones, i.e. "${parameters}" != "${mdMethod.args.join(', ')}"`);
        let args = mdMethod.args.map(arg => new Documentation.Argument(arg));
        let method = new Documentation.Method(methodName, args);
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

/**
 * @param {!Array<string>} dirPath
 * @return {!Promise<{documentation: !Documentation, errors: !Array<string>}>}
 */
module.exports = async function(dirPath) {
  let filePaths = fs.readdirSync(dirPath)
      .filter(fileName => fileName.endsWith('.md'))
      .map(fileName => path.join(dirPath, fileName));
  let classes = [];
  let errors = [];
  const browser = new Browser({args: ['--no-sandbox']});
  for (let filePath of filePaths) {
    const markdownText = fs.readFileSync(filePath, 'utf8');
    const newMarkdownText = markdownToc.insert(markdownText);
    if (markdownText !== newMarkdownText)
      errors.push('Markdown TOC is outdated, run `yarn generate-toc`');
    let outline = await MDOutline.create(browser, markdownText);
    classes.push(...outline.classes);
    errors.push(...outline.errors);
  }
  await browser.close();
  const documentation = new Documentation(classes);
  return { documentation, errors };
};

