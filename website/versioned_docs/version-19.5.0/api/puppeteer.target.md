---
sidebar_label: Target
---

# Target class

Target represents a [CDP target](https://chromedevtools.github.io/devtools-protocol/tot/Target/). In CDP a target is something that can be debugged such a frame, a page or a worker.

#### Signature:

```typescript
export declare class Target
```

## Remarks

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `Target` class.

## Methods

| Method                                                       | Modifiers | Description                                                                                                                                |
| ------------------------------------------------------------ | --------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| [browser()](./puppeteer.target.browser.md)                   |           | Get the browser the target belongs to.                                                                                                     |
| [browserContext()](./puppeteer.target.browsercontext.md)     |           | Get the browser context the target belongs to.                                                                                             |
| [createCDPSession()](./puppeteer.target.createcdpsession.md) |           | Creates a Chrome Devtools Protocol session attached to the target.                                                                         |
| [opener()](./puppeteer.target.opener.md)                     |           | Get the target that opened this target. Top-level targets return <code>null</code>.                                                        |
| [page()](./puppeteer.target.page.md)                         |           | If the target is not of type <code>&quot;page&quot;</code> or <code>&quot;background_page&quot;</code>, returns <code>null</code>.         |
| [type()](./puppeteer.target.type.md)                         |           | Identifies what kind of target this is.                                                                                                    |
| [url()](./puppeteer.target.url.md)                           |           |                                                                                                                                            |
| [worker()](./puppeteer.target.worker.md)                     |           | If the target is not of type <code>&quot;service_worker&quot;</code> or <code>&quot;shared_worker&quot;</code>, returns <code>null</code>. |
