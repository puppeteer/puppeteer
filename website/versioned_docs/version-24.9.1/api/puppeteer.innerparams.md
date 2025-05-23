---
sidebar_label: InnerParams
---

# InnerParams type

### Signature

```typescript
export type InnerParams<T extends unknown[]> = {
  [K in keyof T]: FlattenHandle<T[K]>;
};
```

**References:** [FlattenHandle](./puppeteer.flattenhandle.md)
