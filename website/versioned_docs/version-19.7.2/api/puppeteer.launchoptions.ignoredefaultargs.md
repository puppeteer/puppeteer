---
sidebar_label: LaunchOptions.ignoreDefaultArgs
---

# LaunchOptions.ignoreDefaultArgs property

If `true`, do not use `puppeteer.defaultArgs()` when creating a browser. If an array is provided, these args will be filtered out. Use this with care - you probably want the default arguments Puppeteer uses.

#### Signature:

```typescript
interface LaunchOptions {
  ignoreDefaultArgs?: boolean | string[];
}
```

#### Default value:

false
