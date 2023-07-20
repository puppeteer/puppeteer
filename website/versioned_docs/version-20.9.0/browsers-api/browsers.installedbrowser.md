---
sidebar_label: InstalledBrowser
---

# InstalledBrowser interface

#### Signature:

```typescript
export interface InstalledBrowser
```

## Properties

| Property | Modifiers | Type                                             | Description                                                                                                                                               | Default |
| -------- | --------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| browser  |           | [Browser](./browsers.browser.md)                 |                                                                                                                                                           |         |
| buildId  |           | string                                           |                                                                                                                                                           |         |
| path     |           | string                                           | Path to the root of the installation folder. Use [computeExecutablePath()](./browsers.computeexecutablepath.md) to get the path to the executable binary. |         |
| platform |           | [BrowserPlatform](./browsers.browserplatform.md) |                                                                                                                                                           |         |
