---
sidebar_label: SystemOptions
---

# SystemOptions interface

#### Signature:

```typescript
export interface SystemOptions
```

## Properties

| Property | Modifiers             | Type                                                       | Description                                               | Default            |
| -------- | --------------------- | ---------------------------------------------------------- | --------------------------------------------------------- | ------------------ |
| browser  |                       | [Browser](./browsers.browser.md)                           | Determines which browser to launch.                       |                    |
| channel  |                       | [ChromeReleaseChannel](./browsers.chromereleasechannel.md) | Release channel to look for on the system.                |                    |
| platform | <code>optional</code> | [BrowserPlatform](./browsers.browserplatform.md)           | Determines which platform the browser will be suited for. | **Auto-detected.** |
