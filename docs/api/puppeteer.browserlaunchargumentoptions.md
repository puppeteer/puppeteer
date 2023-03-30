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

| Property      | Modifiers             | Type             | Description                                                                                                                                                   | Default            |
| ------------- | --------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| args          | <code>optional</code> | string\[\]       | Additional command line arguments to pass to the browser instance.                                                                                            |                    |
| debuggingPort | <code>optional</code> | number           | Specify the debugging port number to use                                                                                                                      |                    |
| devtools      | <code>optional</code> | boolean          | Whether to auto-open a DevTools panel for each tab. If this is set to <code>true</code>, then <code>headless</code> will be forced to <code>false</code>.     | <code>false</code> |
| headless      | <code>optional</code> | boolean \| 'new' | Whether to run the browser in headless mode.                                                                                                                  | <code>true</code>  |
| userDataDir   | <code>optional</code> | string           | Path to a user data directory. [see the Chromium docs](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/docs/user_data_dir.md) for more info. |                    |
