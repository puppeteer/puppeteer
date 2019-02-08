<img src="https://user-images.githubusercontent.com/39191/49555713-a07b3c00-f8b5-11e8-8aba-f2d03cd83da5.png" height="200" align="right">

# Puppeteer for Firefox

> Use Puppeteer's API with Firefox

> **BEWARE**: This project is experimental. 🐊 live here. [Is Puppeteer-Firefox Ready?](https://aslushnikov.github.io/ispuppeteerfirefoxready/)

## Getting Started

### Installation

To use Puppeteer with Firefox in your project, run:

```bash
npm i puppeteer-firefox
# or "yarn add puppeteer-firefox"
```

Note: When you install puppeteer-firefox, it downloads a [custom-built Firefox](https://github.com/puppeteer/juggler) (Firefox/63.0.4) that is guaranteed to work with the API.

### Usage

**Example** - navigating to https://example.com and saving a screenshot as *example.png*:

Save file as **example.js**

```js
const pptrFirefox = require('puppeteer-firefox');

(async () => {
  const browser = await pptrFirefox.launch();
  const page = await browser.newPage();
  await page.goto('https://example.com');
  await page.screenshot({path: 'example.png'});
  await browser.close();
})();
```

Execute script on the command line

```bash
node example.js
```


### API Status

Current tip-of-tree status of Puppeteer-Firefox is availabe at [isPuppeteerFirefoxReady?](https://aslushnikov.github.io/ispuppeteerfirefoxready/)


### Credits

Special thanks to [Amine Bouhlali](https://bitbucket.org/aminerop/) who volunteered the [`puppeteer-firefox`](https://www.npmjs.com/package/puppeteer-firefox) NPM package.
