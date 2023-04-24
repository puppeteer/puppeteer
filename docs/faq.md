# FAQ

## Q: Who maintains Puppeteer?

The Chrome DevTools team maintains the library, but we'd love your help and
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

## Q: What are Puppeteer’s goals and principles?

The goals of the project are:

- Provide a slim, canonical library that highlights the capabilities of the
  [DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/).
- Provide a reference implementation for similar testing libraries. Eventually,
  these other frameworks could adopt Puppeteer as their foundational layer.
- Grow the adoption of headless/automated browser testing.
- Help dogfood new DevTools Protocol features...and catch bugs!
- Learn more about the pain points of automated browser testing and help fill
  those gaps.

We adapt
[Chromium principles](https://www.chromium.org/developers/core-principles) to
help us drive product decisions:

- **Speed**: Puppeteer has almost zero performance overhead over an automated
  page.
- **Security**: Puppeteer operates off-process with respect to Chromium, making
  it safe to automate potentially malicious pages.
- **Stability**: Puppeteer should not be flaky and should not leak memory.
- **Simplicity**: Puppeteer provides a high-level API that’s easy to use,
  understand, and debug.

## Q: Is Puppeteer replacing Selenium/WebDriver?

**No**. Both projects are valuable for very different reasons:

- Selenium/WebDriver focuses on cross-browser automation; its value proposition
  is a single standard API that works across all major browsers.
- Puppeteer focuses on Chromium; its value proposition is richer functionality
  and higher reliability.

That said, you **can** use Puppeteer to run tests against Chromium, e.g. using
the community-driven
[jest-puppeteer](https://github.com/smooth-code/jest-puppeteer). While this
probably shouldn’t be your only testing solution, it does have a few good points
compared to WebDriver:

- Puppeteer requires zero setup and comes bundled with the Chromium version it
  works best with, making it
  [very easy to start with](https://github.com/puppeteer/puppeteer/#getting-started).
  At the end of the day, it’s better to have a few tests running chromium-only,
  than no tests at all.
- Puppeteer has event-driven architecture, which removes a lot of potential
  flakiness. There’s no need for evil “sleep(1000)” calls in puppeteer scripts.
- Puppeteer runs headless by default, which makes it fast to run. Puppeteer
  v1.5.0 also exposes browser contexts, making it possible to efficiently
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

```bash
PUPPETEER_PRODUCT=firefox npm i puppeteer
```

#### Q: What’s considered a “Navigation”?

From Puppeteer’s standpoint, **“navigation” is anything that changes a page’s
URL**. Aside from regular navigation where the browser hits the network to fetch
a new document from the web server, this includes
[anchor navigations](https://www.w3.org/TR/html5/single-page.html#scroll-to-fragid)
and [History API](https://developer.mozilla.org/en-US/docs/Web/API/History_API)
usage.

With this definition of “navigation,” **Puppeteer works seamlessly with
single-page applications.**

#### Q: What’s the difference between a “trusted" and "untrusted" input event?

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

#### Q: What features does Puppeteer not support?

You may find that Puppeteer does not behave as expected when controlling pages
that incorporate audio and video. (For example,
[video playback/screenshots is likely to fail](https://github.com/puppeteer/puppeteer/issues/291).)
There are two reasons for this:

- Puppeteer is bundled with Chrome for Testing — not Chrome — and so by default, it
  inherits all of
  [Chromium's media-related limitations](https://www.chromium.org/audio-video).
  This means that Puppeteer does not support licensed formats such as AAC or
  H.264. (However, it is possible to force Puppeteer to use a
  separately-installed version Chrome instead of Chromium via the
  [`executablePath` option to `puppeteer.launch`](./api/puppeteer.launchoptions).
  You should only use this configuration if you need an official release of
  Chrome that supports these media formats.)
- Since Puppeteer (in all configurations) controls a desktop version of
  Chromium/Chrome, features that are only supported by the mobile version of
  Chrome are not supported. This means that Puppeteer
  [does not support HTTP Live Streaming (HLS)](https://caniuse.com/#feat=http-live-streaming).

#### Q: I am having trouble installing / running Puppeteer in my test environment. Where should I look for help?

We have a
[troubleshooting](https://pptr.dev/troubleshooting)
guide for various operating systems that lists the required dependencies.

#### Q: I have more questions! Where do I ask?

There are many ways to get help on Puppeteer:

- [bugtracker](https://github.com/puppeteer/puppeteer/issues)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/puppeteer)

Make sure to search these channels before posting your question.
