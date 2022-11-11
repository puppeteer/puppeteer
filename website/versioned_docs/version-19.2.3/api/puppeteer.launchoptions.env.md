---
sidebar_label: LaunchOptions.env
---

# LaunchOptions.env property

Specify environment variables that will be visible to the browser.

#### Signature:

```typescript
interface LaunchOptions {
  env?: Record<string, string | undefined>;
}
```

#### Default value:

The contents of `process.env`.
