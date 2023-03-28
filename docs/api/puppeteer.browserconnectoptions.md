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

| Property          | Modifiers             | Type                                                        | Description                                                                               | Default              |
| ----------------- | --------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------- | -------------------- |
| defaultViewport   | <code>optional</code> | [Viewport](./puppeteer.viewport.md) \| null                 | Sets the viewport for each page.                                                          |                      |
| ignoreHTTPSErrors | <code>optional</code> | boolean                                                     | Whether to ignore HTTPS errors during navigation.                                         | <code>false</code>   |
| protocolTimeout   | <code>optional</code> | number                                                      | Timeout setting for individual protocol (CDP) calls.                                      | <code>180_000</code> |
| slowMo            | <code>optional</code> | number                                                      | Slows down Puppeteer operations by the specified amount of milliseconds to aid debugging. |                      |
| targetFilter      | <code>optional</code> | [TargetFilterCallback](./puppeteer.targetfiltercallback.md) | Callback to decide if Puppeteer should connect to a given target or not.                  |                      |
