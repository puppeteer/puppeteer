---
sidebar_label: Options
---

# Options interface

#### Signature:

```typescript
export interface ComputeExecutablePathOptions
```

## Properties

| Property | Modifiers             | Type                                             | Description                                                                                                    | Default            |
| -------- | --------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- | ------------------ |
| browser  |                       | [Browser](./browsers.browser.md)                 | Determines which browser to launch.                                                                            |                    |
| buildId  |                       | string                                           | Determines which buildId to download. BuildId should uniquely identify binaries and they are used for caching. |                    |
| cacheDir |                       | string                                           | Root path to the storage directory.                                                                            |                    |
| platform | <code>optional</code> | [BrowserPlatform](./browsers.browserplatform.md) | Determines which platform the browser will be suited for.                                                      | **Auto-detected.** |
