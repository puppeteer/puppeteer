---
sidebar_label: BrowserContext.isIncognito
---

# BrowserContext.isIncognito() method

> Warning: This API is now obsolete.
>
> In Chrome, the [default browser context](./puppeteer.browser.defaultbrowsercontext.md) can also be "incognito" if configured via the arguments and in such cases this getter returns wrong results (see https://github.com/puppeteer/puppeteer/issues/8836). Also, the term "incognito" is not applicable to other browsers. To migrate, check the [default browser context](./puppeteer.browser.defaultbrowsercontext.md) instead: in Chrome all non-default contexts are incognito, and the default context might be incognito if you provide the `--incognito` argument when launching the browser.

Whether this [browser context](./puppeteer.browsercontext.md) is incognito.

In Chrome, the [default browser context](./puppeteer.browser.defaultbrowsercontext.md) is the only non-incognito browser context.

#### Signature:

```typescript
class BrowserContext {
  abstract isIncognito(): boolean;
}
```

**Returns:**

boolean
