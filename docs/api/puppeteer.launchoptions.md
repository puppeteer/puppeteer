---
sidebar_label: LaunchOptions
---

# LaunchOptions type

#### Signature:

```typescript
export type LaunchOptions = BaseLaunchOptions &
  (
    | {
        product?: 'chrome';
      }
    | {
        product: 'firefox';
        protocol?: ProtocolType;
      }
  );
```

**References:** [BaseLaunchOptions](./puppeteer.baselaunchoptions.md), [ProtocolType](./puppeteer.protocoltype.md)
