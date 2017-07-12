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
      let member = {};
      for (let element of document.body.querySelectorAll('h3, h4, h4 + ul > li')) {
        if (element.matches('h3')) {
          currentClass = {
            name: element.textContent,
            members: [],
          };
          classes.push(currentClass);
        } else if (element.matches('h4')) {
          member = {
            name: element.textContent,
            args: []
          };
          currentClass.members.push(member);
        } else if (element.matches('li') && element.firstChild.matches && element.firstChild.matches('code')) {
          member.args.push(element.firstChild.textContent);
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
    const methodRegex = /^(\w+)\.([\w$]+)\((.*)\)$/;
    const propertyRegex = /^(\w+)\.(\w+)$/;
    let currentClassName = null;
    let currentClassMethods = [];
    let currentClassProperties = [];
    for (const cls of classes) {
      let match = cls.name.match(classHeading);
      currentClassName = match[1];
      for (let member of cls.members) {
        if (constructorRegex.test(member.name)) {
          let match = member.name.match(constructorRegex);
          handleMethod.call(this, member, match[1], 'constructor', match[2]);
        } else if (methodRegex.test(member.name)) {
          let match = member.name.match(methodRegex);
          handleMethod.call(this, member, match[1], match[2], match[3]);
        } else if (propertyRegex.test(member.name)) {
          let match = member.name.match(propertyRegex);
          handleProperty.call(this, member, match[1], match[2]);
        }
      }
      flushClassIfNeeded.call(this);
    }

    function handleMethod(member, className, methodName, parameters) {
      if (!currentClassName || !className || !methodName || className.toLowerCase() !== currentClassName.toLowerCase()) {
        this.errors.push(`Failed to process header as method: ${member.name}`);
        return;
      }
      parameters = parameters.trim().replace(/[\[\]]/g, '');
      if (parameters !== member.args.join(', '))
        this.errors.push(`Heading arguments for "${member.name}" do not match described ones, i.e. "${parameters}" != "${member.args.join(', ')}"`);
      let args = member.args.map(arg => new Documentation.Argument(arg));
      let method = new Documentation.Method(methodName, args);
      currentClassMethods.push(method);
    }

    function handleProperty(member, className, propertyName) {
      if (!currentClassName || !className || !propertyName || className.toLowerCase() !== currentClassName.toLowerCase()) {
        this.errors.push(`Failed to process header as property: ${member.name}`);
        return;
      }
      currentClassProperties.push(propertyName);
    }

    function flushClassIfNeeded() {
      if (currentClassName === null)
        return;
      this.classes.push(new Documentation.Class(currentClassName, currentClassMethods, currentClassProperties));
      currentClassName = null;
      currentClassMethods = [];
      currentClassProperties = [];
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

