---
sidebar_label: InnerParams
---

# InnerParams type

#### Signature:

```typescript
export type InnerParams<T extends unknown[]> = &#123;
    [K in keyof T]: FlattenHandle<T[K]>;
&#125;;
```

**References:** [FlattenHandle](./puppeteer.flattenhandle.md)
