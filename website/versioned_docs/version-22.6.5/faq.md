# FAQ

## Q: Who maintains Puppeteer?

The Chrome Browser Automation team maintains the library, but we'd love your help and
expertise on the project! See our
[contributing guide](https://pptr.dev/contributing).

## Q: What is the status of cross-browser support?

Official Firefox support is currently experimental. The ongoing collaboration
with Mozilla aims to support common end-to-end testing use cases, for which
developers expect cross-browser coverage. The Puppeteer team needs input from
users to stabilize Firefox support and to bring missing APIs to our attention.

From Puppeteer v2.1.0 onwards you can specify
[`puppeteer.launch({product: 'firefox'})`](./api/puppeteer.puppeteernode.launch)
to run your Puppeteer scripts in Firefox Nightly, without any additional custom
patches. While
[an older experiment](https://www.npmjs.com/package/puppeteer-firefox) required
a patched version of Firefox,
[the current approach](https://wiki.mozilla.org/Remote) works with “stock”
Firefox.

We will continue to collaborate with other browser vendors to bring Puppeteer
support to browsers such as Safari. This effort includes exploration of a
standard for executing cross-browser commands (instead of relying on the
non-standard DevTools Protocol used by Chrome).

Update 2023-11-17: Puppeteer has experimental support for the new
[WebDriverBiDi](https://w3c.github.io/webdriver-bidi/) protocol that can be used
to automate Firefox. The WebDriver BiDi implementation in Firefox will replace
the current CDP implementation in Firefox in the future. See
https://pptr.dev/webdriver-bidi for more details.

## Q: Does Puppeteer support WebDriver BiDi?

Puppeteer has experimental support for WebDriver BiDi. See https://pptr.dev/webdriver-bidi.

## Q: What are Puppeteer’s goals and principles?

The goals of the project are:

- Provide a reference implementation that highlights the capabilities of the
  [Chrome DevTools](https://chromedevtools.github.io/devtools-protocol/)
  and [WebDriver BiDi](https://w3c.github.io/webdriver-bidi/) protocols.
- Grow the adoption of automated cross-browser testing.
- Help dogfood new DevTools Protocol and WebDriver BiDi features...and catch bugs!
- Learn more about the pain points of automated browser testing and help fill
  those gaps.

We adapt
[Chromium principles](https://www.chromium.org/developers/core-principles) to
help us drive product decisions:

- **Speed**: Puppeteer has almost zero performance overhead over an automated
  page.
- **Security**: Puppeteer operates off-process with respect to the browser, making
  it safe to automate potentially malicious pages.
- **Stability**: Puppeteer should not be flaky and should not leak memory.
- **Simplicity**: Puppeteer provides a high-level API that’s easy to use,
  understand, and debug.

## Q: Is Puppeteer a replacement for Selenium WebDriver?

**No**. Both projects are valuable for very different reasons:

- Selenium WebDriver focuses on cross-browser automation and provides bindings for
  multiple languages; Puppeteer is only for JavaScript.
- Puppeteer focuses on Chromium; its value proposition is richer functionality
  for Chromium-based browsers.

That said, you **can** use Puppeteer to run tests against Chromium, e.g. using
the community-driven
[jest-puppeteer](https://github.com/smooth-code/jest-puppeteer) or
[Puppeteer's Angular integration](https://pptr.dev/integrations/ng-schematics). While this
probably shouldn’t be your only testing solution, it does have a few good points
compared to WebDriver classic:

- Puppeteer requires zero setup and comes bundled with the Chrome version it
  works best with, making it
  [very easy to start with](https://github.com/puppeteer/puppeteer/#getting-started).
- Puppeteer has event-driven architecture, which removes a lot of potential
  flakiness. There’s no need for “sleep(1000)” calls in puppeteer scripts.
- Puppeteer exposes browser contexts, making it possible to efficiently
  parallelize test execution.
- Puppeteer shines when it comes to debugging: flip the “headless” bit to false,
  add “slowMo”, and you’ll see what the browser is doing. You can even open
  Chrome DevTools to inspect the test environment.

## Q: Why doesn’t Puppeteer v.XXX work with Chromium v.YYY?

We see Puppeteer as an **indivisible entity** with Chromium. Each version of
Puppeteer bundles a specific version of Chromium – **the only** version it is
guaranteed to work with.

This is not an artificial constraint: A lot of work on Puppeteer is actually
taking place in the Chromium repository. Here’s a typical story:

- A Puppeteer bug is reported:
  https://github.com/puppeteer/puppeteer/issues/2709
- It turned out this is an issue with the DevTools protocol, so we’re fixing it
  in Chromium: https://chromium-review.googlesource.com/c/chromium/src/+/1102154
- Once the upstream fix is landed, we roll updated Chromium into Puppeteer:
  https://github.com/puppeteer/puppeteer/pull/2769

## Q: Which Chrome version does Puppeteer use?

Look for the `chrome` entry in
[revisions.ts](https://github.com/puppeteer/puppeteer/blob/main/packages/puppeteer-core/src/revisions.ts).

## Q: Which Firefox version does Puppeteer use?

Since Firefox support is experimental, Puppeteer downloads the latest
[Firefox Nightly](https://wiki.mozilla.org/Nightly) when the `PUPPETEER_PRODUCT`
environment variable is set to `firefox`. That's also why the value of `firefox`
in
[revisions.ts](https://github.com/puppeteer/puppeteer/blob/main/packages/puppeteer-core/src/revisions.ts)
is `latest` -- Puppeteer isn't tied to a particular Firefox version.

To fetch Firefox Nightly as part of Puppeteer installation:

```bash npm2yarn
PUPPETEER_PRODUCT=firefox npm i puppeteer
```

To download Firefox Nightly into an existing Puppeteer project:

```bash
npx puppeteer browsers install firefox
```

## Q: What’s considered a “Navigation”?

From Puppeteer’s standpoint, **“navigation” is anything that changes a page’s
URL**. Aside from regular navigation where the browser hits the network to fetch
a new document from the web server, this includes
[anchor navigations](https://www.w3.org/TR/html5/single-page.html#scroll-to-fragid)
and [History API](https://developer.mozilla.org/en-US/docs/Web/API/History_API)
usage.

With this definition of “navigation,” **Puppeteer works seamlessly with
single-page applications.**

## Q: What’s the difference between a “trusted" and "untrusted" input event?

In browsers, input events could be divided into two big groups: trusted vs.
untrusted.

- **Trusted events**: events generated by users interacting with the page, e.g.
  using a mouse or keyboard.
- **Untrusted event**: events generated by Web APIs, e.g. `document.createEvent`
  or `element.click()` methods.

Websites can distinguish between these two groups:

- using an
  [`Event.isTrusted`](https://developer.mozilla.org/en-US/docs/Web/API/Event/isTrusted)
  event flag
- sniffing for accompanying events. For example, every trusted `'click'` event
  is preceded by `'mousedown'` and `'mouseup'` events.

For automation purposes it’s important to generate trusted events. **All input
events generated with Puppeteer are trusted and fire proper accompanying
events.** If, for some reason, one needs an untrusted event, it’s always
possible to hop into a page context with `page.evaluate` and generate a fake
event:

```ts
await page.evaluate(() => {
  document.querySelector('button[type=submit]').click();
});
```

## Q: Does Puppeteer support media and audio playback?

Puppeteer uses [Chrome for Testing](https://developer.chrome.com/blog/chrome-for-testing/) binaries
by default which ship with properietary codecs support starting from
[M120](https://chromiumdash.appspot.com/commit/12d607016c31ea13579e897740c765be189ed6eb).

## Q: I am having trouble installing / running Puppeteer in my test environment. Where should I look for help?

We have a
[troubleshooting](https://pptr.dev/troubleshooting)
guide for various operating systems that lists the required dependencies.

## Q: I have more questions! Where do I ask?

There are many ways to get help on Puppeteer:

- For questions: [Stack Overflow](https://stackoverflow.com/questions/tagged/puppeteer)
- For bug reports: [GitHub Issues](https://github.com/puppeteer/puppeteer/issues)

Make sure to search these channels before posting your question.
