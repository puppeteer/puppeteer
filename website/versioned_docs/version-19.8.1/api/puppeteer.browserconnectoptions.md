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

| Property                                                                     | Modifiers | Type                                                        | Description                                                                                            | Default |
| ---------------------------------------------------------------------------- | --------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------- |
| [defaultViewport?](./puppeteer.browserconnectoptions.defaultviewport.md)     |           | [Viewport](./puppeteer.viewport.md) \| null                 | _(Optional)_ Sets the viewport for each page.                                                          |         |
| [ignoreHTTPSErrors?](./puppeteer.browserconnectoptions.ignorehttpserrors.md) |           | boolean                                                     | _(Optional)_ Whether to ignore HTTPS errors during navigation.                                         | false   |
| [protocolTimeout?](./puppeteer.browserconnectoptions.protocoltimeout.md)     |           | number                                                      | _(Optional)_ Timeout setting for individual protocol (CDP) calls.                                      | 180000  |
| [slowMo?](./puppeteer.browserconnectoptions.slowmo.md)                       |           | number                                                      | _(Optional)_ Slows down Puppeteer operations by the specified amount of milliseconds to aid debugging. |         |
| [targetFilter?](./puppeteer.browserconnectoptions.targetfilter.md)           |           | [TargetFilterCallback](./puppeteer.targetfiltercallback.md) | _(Optional)_ Callback to decide if Puppeteer should connect to a given target or not.                  |         |
