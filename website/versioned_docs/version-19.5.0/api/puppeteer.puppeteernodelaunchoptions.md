---
sidebar_label: PuppeteerNodeLaunchOptions
---

# PuppeteerNodeLaunchOptions type

Utility type exposed to enable users to define options that can be passed to `puppeteer.launch` without having to list the set of all types.

#### Signature:

```typescript
export type PuppeteerNodeLaunchOptions = BrowserLaunchArgumentOptions &
  LaunchOptions &
  BrowserConnectOptions;
```

**References:** [BrowserLaunchArgumentOptions](./puppeteer.browserlaunchargumentoptions.md), [LaunchOptions](./puppeteer.launchoptions.md), [BrowserConnectOptions](./puppeteer.browserconnectoptions.md)
