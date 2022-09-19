---
sidebar_label: InnerParams
---

# InnerParams type

**Signature:**

```typescript
export declare type InnerParams<T extends unknown[]> = {
  [K in keyof T]: FlattenHandle<FlattenLazyArg<FlattenHandle<T[K]>>>;
};
```

**References:** [FlattenHandle](./puppeteer.flattenhandle.md)
