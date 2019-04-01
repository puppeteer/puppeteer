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

### Add-ons

Firefox Add-ons differs from Chrome extensions, hence precess of its install is different.
Firefox add-on can be installed using [web-ext](https://github.com/mozilla/web-ext) library which runs Firefox binary and can be connected using Puppeteer `connect` API.

```js
const webExt = require('web-ext').default;
const pptrFirefox = require('puppeteer-firefox');
const getPort = require('get-port');

(async () => {
  const CDPPort = await getPort();
  await webExt.cmd.run(
      {
        sourceDir: 'path-to-add-on',
        firefox: pptrFirefox.executablePath(),
        args: [`-juggler=${CDPPort}`]
      },
      {
        // These are non CLI related options for each function.
        // You need to specify this one so that your NodeJS application
        // can continue running after web-ext is finished.
        shouldExitProgram: false
      }
    );

    const browserWSEndpoint = `ws://127.0.0.1:${CDPPort}`
    browser = await PP_FF.connect({
      browserWSEndpoint
    })
})();

```

> Note: web-ext hasn't been released with support of `args` option, hence you can use build of master branch with this feature.

`package.json` example
```js
{
  "dependencies": {
    ...
    "get-port": "^4.2.0",
    "web-ext": "denar90/web-ext#build-args-feature",
    "puppeteer-firefox": "^0.5.0"
    ...
  },
}
```

### Credits

Special thanks to [Amine Bouhlali](https://bitbucket.org/aminerop/) who volunteered the [`puppeteer-firefox`](https://www.npmjs.com/package/puppeteer-firefox) NPM package.
