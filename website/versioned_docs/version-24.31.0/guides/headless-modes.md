# Headless mode

By default Puppeteer launches the browser in
[the Headless mode](https://developer.chrome.com/docs/chromium/new-headless/).

```ts
const browser = await puppeteer.launch();
// Equivalent to
const browser = await puppeteer.launch({headless: true});
```

Before v22, Puppeteer launched the [old Headless mode](https://developer.chrome.com/docs/chromium/new-headless/) by default.
The old headless mode is now known as
[`chrome-headless-shell`](https://developer.chrome.com/blog/chrome-headless-shell)
and ships as a separate binary. `chrome-headless-shell` does not match the
behavior of the regular Chrome completely but it is currently more performant
for automation tasks where the complete Chrome feature set is not needed. If the performance
is more important for your use case, switch to `chrome-headless-shell` as following:

```ts
const browser = await puppeteer.launch({headless: 'shell'});
```

To launch a "headful" version of Chrome, set the
[`headless`](https://pptr.dev/api/puppeteer.launchoptions) to `false`
option when launching a browser:

```ts
const browser = await puppeteer.launch({headless: false});
```
