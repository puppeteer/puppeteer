# Debugging

Debugging with Puppeteer can be an arduous task. There is no _single_ method for
debugging all possible issues since Puppeteer touches many distinct components
of a browser such as network requests and Web APIs. On a high note, Puppeteer
provides _several_ methods for debugging which hopefully does cover all possible
issues.

## Background

In general, there are two possible sources of an issue: Code running on Node.js
(which we call _server code_), and
[code running in the browser](../api/puppeteer.page.evaluate)
(which we call _client code_). There is also a third possible source being the
browser itself (which we call _internal code_), but if you suspect this is the
source **after attempting the methods below**, we suggest
[searching existing issues](https://github.com/puppeteer/puppeteer/issues)
before
[filing an issue](https://github.com/puppeteer/puppeteer/issues/new/choose).

## Debugging methods for all situations

These methods can be used to debug any situation. These should be used as a
quick sanity check before diving into more complex methods.

### Turn off [`headless`](../api/puppeteer.browserlaunchargumentoptions)

Sometimes it's useful to see what the browser is displaying. Instead of
launching in
[`headless`](../api/puppeteer.browserlaunchargumentoptions) mode,
launch a full version of the browser with
[`headless`](../api/puppeteer.browserlaunchargumentoptions) set to
`false`:

```ts
const browser = await puppeteer.launch({headless: false});
```

### Puppeteer "slow-mo"

The [`slowMo`](../api/puppeteer.browserconnectoptions) option slows down
Puppeteer operations by a specified amount of milliseconds. It's another way to
help see what's going on.

```ts
const browser = await puppeteer.launch({
  headless: false,
  slowMo: 250, // slow down by 250ms
});
```

## Debugging methods for client code

### Capture `console.*` output

Since client code runs in the browser, doing `console.*` in client code will not
directly log to Node.js. However, you can [listen](../api/puppeteer.page.on) for
the [`console`](../api/puppeteer.pageeventobject) event which returns a
payload with the logged text.

```ts
page.on('console', msg => console.log('PAGE LOG:', msg.text()));

await page.evaluate(() => console.log(`url is ${location.href}`));
```

### Use the debugger in the browser

1. Set [`devtools`](../api/puppeteer.browserlaunchargumentoptions) to
   `true` when launching Puppeteer:

   ```ts
   const browser = await puppeteer.launch({devtools: true});
   ```

2. Add `debugger` inside any client code you want debugged. For example,

   ```ts
   await page.evaluate(() => {
     debugger;
   });
   ```

   The Browser will now stop in the location the `debugger` word is found in
   debug mode.

## Debugging methods for server code

### Use the debugger in Node.js (Chrome/Chromium-only)

Since server code intermingles with client code, this method of debugging is
closely tied with the browser. For example, you can step over
`await page.click()` in the server script and see the click happen in the
browser.

Note that you won't be able to run `await page.click()` in DevTools console due
to this
[Chromium bug](https://bugs.chromium.org/p/chromium/issues/detail?id=833928), so
if you want to try something out, you have to add it to your test file.

1. Set [`headless`](../api/puppeteer.browserlaunchargumentoptions) to
   `false`.
2. Add `debugger` to any server code you want debugged. For example,

   ```ts
   debugger;
   await page.click('a[target=_blank]');
   ```

3. Run your server code with `--inspect-brk`. For example,

   ```sh
   node --inspect-brk path/to/script.js
   ```

4. In the opened Chrome/Chromium browser, open `chrome://inspect/#devices` and
   click `inspect`.
5. In the newly opened test browser, press `F8` to resume test execution.
6. Now your `debugger` statement will be hit and you can debug in the test
   browser.

### Log DevTools protocol traffic

If all else fails, it's possible there may be an issue between Puppeteer and the
DevTools protocol. You can debug this by setting the `DEBUG` environment
variable before running your script. This will log internal traffic via
[`debug`](https://github.com/visionmedia/debug) under the `puppeteer` namespace.

```sh
# Basic verbose logging
env DEBUG="puppeteer:*" node script.js

# Prevent truncating of long messages
env DEBUG="puppeteer:*" env DEBUG_MAX_STRING_LENGTH=null node script.js

# Protocol traffic can be rather noisy. This example filters out all Network domain messages
env DEBUG="puppeteer:*" env DEBUG_COLORS=true node script.js 2>&1 | grep -v '"Network'
```
