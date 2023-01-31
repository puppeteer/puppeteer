---
sidebar_label: BrowserConnectOptions
---

# BrowserConnectOptions interface

Generic browser options that can be passed when launching any browser or when connecting to an existing browser instance.

#### Signature:

```typescript
export interface BrowserConnectOptions
```

## Properties

| Property                                                                     | Modifiers | Type                                                        | Description                                                                                                 | Default |
| ---------------------------------------------------------------------------- | --------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------- |
| [defaultViewport?](./puppeteer.browserconnectoptions.defaultviewport.md)     |           | [Viewport](./puppeteer.viewport.md) \| null                 | <i>(Optional)</i> Sets the viewport for each page.                                                          |         |
| [ignoreHTTPSErrors?](./puppeteer.browserconnectoptions.ignorehttpserrors.md) |           | boolean                                                     | <i>(Optional)</i> Whether to ignore HTTPS errors during navigation.                                         | false   |
| [slowMo?](./puppeteer.browserconnectoptions.slowmo.md)                       |           | number                                                      | <i>(Optional)</i> Slows down Puppeteer operations by the specified amount of milliseconds to aid debugging. |         |
| [targetFilter?](./puppeteer.browserconnectoptions.targetfilter.md)           |           | [TargetFilterCallback](./puppeteer.targetfiltercallback.md) | <i>(Optional)</i> Callback to decide if Puppeteer should connect to a given target or not.                  |         |
