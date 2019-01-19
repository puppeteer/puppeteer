# Bundling For Web Browsers

To bundle Puppeteer using [Browserify](http://browserify.org/):

1. Clone Puppeteer repository: `git clone https://github.com/GoogleChrome/puppeteer && cd puppeteer`
2. `npm install`
3. Run `npm run bundle`

This will create `./utils/browser/puppeteer-web.js` file that contains Puppeteer bundle.

You can use it later on in your web page to drive
another browser instance through its WS Endpoint:

```html
<script src='./puppeteer-web.js'></script>
<script>
  const puppeteer = require('puppeteer');
  const browser = await puppeteer.connect({
    browserWSEndpoint: '<another-browser-ws-endpont>'
  });
  // ... drive automation ...
</script>
```

See our [puppeteer-web tests](https://github.com/GoogleChrome/puppeteer/blob/master/utils/browser/test.js)
for details.

### Running inside Chrome Extension

You might want to enable `unsafe-eval` inside the extension by adding the following
to your `manifest.json` file:

```
"content_security_policy": "script-src 'self' 'unsafe-eval'; object-src 'self'"
```

Please see discussion in https://github.com/GoogleChrome/puppeteer/issues/3455.
