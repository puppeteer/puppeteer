# How to Contribute

First of all, thank you for your interest in Puppeteer!
We'd love to accept your patches and contributions!

## Contributor License Agreement

Contributions to this project must be accompanied by a Contributor License
Agreement. You (or your employer) retain the copyright to your contribution,
this simply gives us permission to use and redistribute your contributions as
part of the project. Head over to <https://cla.developers.google.com/> to see
your current agreements on file or to sign a new one.

You generally only need to submit a CLA once, so if you've already submitted one
(even if it was for a different project), you probably don't need to do it
again.

## Code reviews

All submissions, including submissions by project members, require review. We
use GitHub pull requests for this purpose. Consult
[GitHub Help](https://help.github.com/articles/about-pull-requests/) for more
information on using pull requests.

## Code Style

The coding style is fully defined in [.eslintrc](https://github.com/GoogleChrome/puppeteer/blob/master/.eslintrc.js).
Please make sure to run `npm lint` before submitting PR.

We use JSDoc along with closure annotations. Annotations are encouraged for
all contributions.

## Testing

All new features should be accompanied by tests. Puppeteer tests are located in [test/test.js](https://github.com/GoogleChrome/puppeteer/blob/master/test/test.js)
and are written using [Jasmine](https://jasmine.github.io/) testing framework.

There are also phantomjs tests located under [third_party/phantomjs/test](https://github.com/GoogleChrome/puppeteer/tree/master/third_party/phantomjs). These
are used to test `phantom_shim`.

To run puppeteer tests, use:
```
npm run unit
```

To run all tests, including lints:
```
npm test
```

To debug unit tests:
```
npm run debug-unit
```

To run unit tests in non-headless mode:
```
HEADLESS=false npm run unit
```

## DEBUG module
Puppeteer uses [debug](https://github.com/visionmedia/debug) module to expose some of it's inner guts under the `puppeteer` namespace.
Try putting the following script in the `script.js` and running it via `DEBUG=* node script.js`:

```js
const {Browser} = require('puppeteer');
const browser = new Browser();
browser.newPage().then(async page => {
  await page.navigate('https://example.com');
  browser.close();
});
```

Tips-n-tricks:
- `DEBUG=*,-*:protocol node script.js` - dump everything BUT protocol messages
- `DEBUG=*:page node script.js` - dump only Page's API calls
- `DEBUG=*:mouse,*:keyboard node script.js` - dump only Mouse and Keyboard API calls