<img src="https://user-images.githubusercontent.com/39191/49555713-a07b3c00-f8b5-11e8-8aba-f2d03cd83da5.png" height="200" align="right">

# Prototype: Puppeteer for Firefox

**⚠️ The puppeteer-firefox package has been deprecated**: Firefox support is gradually transitioning to the puppeteer package. As of puppeteer v2.1.0 you can interact with Firefox Nightly. The puppeteer-firefox package will remain available until the transition is complete, but it is no longer actively maintained. For more information visit https://wiki.mozilla.org/Remote

This project is an experimental feasibility prototype to guide the work of implementing Puppeteer endpoints into Firefox's code base. Mozilla's [bug 1545057](https://bugzilla.mozilla.org/show_bug.cgi?id=1545057) tracks the initial milestone, which will be based on a CDP-based [remote protocol](https://wiki.mozilla.org/Remote).

## Getting Started

### Installation

To try out Puppeteer with Firefox in your project, run:

```bash
npm i puppeteer-firefox
# or "yarn add puppeteer-firefox"
```

Note: When you install puppeteer-firefox, it downloads a [custom-built Firefox](https://github.com/puppeteer/juggler) (Firefox/63.0.4) that is guaranteed to work with the API.

### Usage

**Example** - navigating to https://example.com and saving a screenshot as `example.png`:

Save file as **example.js**

```js
const pptrFirefox = require('puppeteer-firefox');

(async () => {
  const browser = await pptrFirefox.launch();
  const page = await browser.newPage();
  await page.goto('https://example.com');
  await page.screenshot({ path: 'example.png' });
  await browser.close();
})();
```

Execute script on the command line

```bash
node example.js
```

### Credits

Special thanks to [Amine Bouhlali](https://bitbucket.org/aminerop/) who volunteered the [`puppeteer-firefox`](https://www.npmjs.com/package/puppeteer-firefox) NPM package.
