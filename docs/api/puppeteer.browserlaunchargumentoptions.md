---
sidebar_label: BrowserLaunchArgumentOptions
---

# BrowserLaunchArgumentOptions interface

Launcher options that only apply to Chrome.

#### Signature:

```typescript
export interface BrowserLaunchArgumentOptions
```

## Properties

| Property                                                                    | Modifiers | Type             | Description                                                                                                                                                                | Default            |
| --------------------------------------------------------------------------- | --------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| [args?](./puppeteer.browserlaunchargumentoptions.args.md)                   |           | string\[\]       | _(Optional)_ Additional command line arguments to pass to the browser instance.                                                                                            |                    |
| [debuggingPort?](./puppeteer.browserlaunchargumentoptions.debuggingport.md) |           | number           | _(Optional)_                                                                                                                                                               |                    |
| [devtools?](./puppeteer.browserlaunchargumentoptions.devtools.md)           |           | boolean          | _(Optional)_ Whether to auto-open a DevTools panel for each tab. If this is set to <code>true</code>, then <code>headless</code> will be forced to <code>false</code>.     | <code>false</code> |
| [headless?](./puppeteer.browserlaunchargumentoptions.headless.md)           |           | boolean \| 'new' | _(Optional)_ Whether to run the browser in headless mode.                                                                                                                  | true               |
| [userDataDir?](./puppeteer.browserlaunchargumentoptions.userdatadir.md)     |           | string           | _(Optional)_ Path to a user data directory. [see the Chromium docs](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/docs/user_data_dir.md) for more info. |                    |
