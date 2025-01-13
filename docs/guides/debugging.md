# Debugging

Debugging with Puppeteer can be an arduous task. There is no _single_ method for
debugging all possible issues since Puppeteer touches many distinct components
of a browser such as network requests and Web APIs. On a high note, Puppeteer
provides _several_ methods for debugging which hopefully do cover all possible
issues.

## Background

In general, there are two possible sources of an issue: Code running on Node.js
(which we call _server code_), and
[code running in the browser](../api/puppeteer.page.evaluate)
(which we call _client code_). There is also a third possible source being the
browser itself (which we call _internal code_ or _browser code_), but if you suspect this is the
source **after attempting the methods below**, we suggest
[searching existing issues](https://github.com/puppeteer/puppeteer/issues)
before
[filing an issue](https://github.com/puppeteer/puppeteer/issues/new/choose).

## Debugging methods for all situations

These methods can be used to debug any situation. These should be used as a
quick sanity check before diving into more complex methods.

### Turn off [`headless`](../api/puppeteer.launchoptions)

Sometimes it's useful to see what the browser is displaying. Instead of
launching in
[`headless`](../api/puppeteer.launchoptions) mode,
launch a full version of the browser with
[`headless`](../api/puppeteer.launchoptions) set to
`false`:

```ts
const browser = await puppeteer.launch({headless: false});
```

### Puppeteer "slow-mo"

The [`slowMo`](../api/puppeteer.connectoptions) option slows down
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
directly log to Node.js. However, you can [listen (page.on)](../api/puppeteer.page) for
the [`console`](../api/puppeteer.pageevents) event which returns a
payload with the logged text.

```ts
page.on('console', msg => console.log('PAGE LOG:', msg.text()));

await page.evaluate(() => console.log(`url is ${location.href}`));
```

### Use the debugger in the browser

1. Set [`devtools`](../api/puppeteer.launchoptions) to
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

1. Set [`headless`](../api/puppeteer.launchoptions) to
   `false`.
2. Add `debugger` to any server code you want debugged. For example,

   ```ts
   debugger;
   await page.click('a[target=_blank]');
   ```

3. Run your server code with `--inspect-brk`. For example,

   ```bash
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

```bash
# Basic verbose logging
env DEBUG="puppeteer:*" node script.js

# Prevent truncating of long messages
env DEBUG="puppeteer:*" env DEBUG_MAX_STRING_LENGTH=null node script.js

# Protocol traffic can be rather noisy. This example filters out all Network domain messages
env DEBUG="puppeteer:*" env DEBUG_COLORS=true node script.js 2>&1 | grep -v '"Network'

# Filter out all protocol messages but keep all other logging
env DEBUG="puppeteer:*,-puppeteer:protocol:*" node script.js
```

### Log pending protocol calls

If you encounter issues with async Puppeteer calls not getting resolved, try logging
pending callbacks by using the [`debugInfo`](https://pptr.dev/api/puppeteer.browser/#properties) interface
to see what call is the cause:

```ts
console.log(browser.debugInfo.pendingProtocolErrors);
```

The getter returns a list of `Error` objects and the stacktraces of the error objects
indicate which code triggered a protocol call.

## Debugging methods for the browser code

### Print browser logs

If the browser unexpectedly crashes or does not launch properly, it could be useful
to inspect logs from the browser process by setting the launch attribute `dumpio` to `true`.

```ts
const browser = await puppeteer.launch({
  dumpio: true,
});
```

In this case, Puppeteer forwards browser logs to the Node process' stdio.
