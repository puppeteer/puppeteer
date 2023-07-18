---
sidebar_label: UninstallOptions
---

# UninstallOptions interface

#### Signature:

```typescript
export interface UninstallOptions
```

## Properties

| Property | Modifiers             | Type                                             | Description                                     | Default            |
| -------- | --------------------- | ------------------------------------------------ | ----------------------------------------------- | ------------------ |
| browser  |                       | [Browser](./browsers.browser.md)                 | Determines which browser to uninstall.          |                    |
| buildId  |                       | string                                           | The browser build to uninstall                  |                    |
| cacheDir |                       | string                                           | The path to the root of the cache directory.    |                    |
| platform | <code>optional</code> | [BrowserPlatform](./browsers.browserplatform.md) | Determines the platform for the browser binary. | **Auto-detected.** |
