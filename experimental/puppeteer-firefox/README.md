<img src="https://user-images.githubusercontent.com/39191/49555713-a07b3c00-f8b5-11e8-8aba-f2d03cd83da5.png" height="200" align="right">

# Prototype: Puppeteer for Firefox

> Use Puppeteer's API with Firefox

**⚠️ BEWARE**: Experimental. Just for preview. Installation and usage will change.

This project is a feasibility prototype to guide the work of implementing Puppeteer endpoints into Firefox's code base. Mozilla's [bug 1545057](https://bugzilla.mozilla.org/show_bug.cgi?id=1545057) tracks the initial milestone, which will be based on a CDP-based [remote protocol](https://wiki.mozilla.org/Remote).

## Getting Started

### Installation

To try out Puppeteer with Firefox in your project, run:

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
Firefox Add-on can be installed using [web-ext](https://github.com/mozilla/web-ext) library which runs Firefox binary and can be connected using Puppeteer `connect` API.

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
    const browser = await pptrFirefox.connect({
      browserWSEndpoint: `ws://127.0.0.1:${CDPPort}`
    });
})();
```

`package.json` example
```js
{
  "dependencies": {
    ...
    "get-port": "^4.2.0",
    "web-ext": "^3.1.0",
    "puppeteer-firefox": "^0.5.0"
    ...
  },
}
```

### Credits

Special thanks to [Amine Bouhlali](https://bitbucket.org/aminerop/) who volunteered the [`puppeteer-firefox`](https://www.npmjs.com/package/puppeteer-firefox) NPM package.
