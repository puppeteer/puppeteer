---
sidebar_label: UnionLocatorOf
---

# UnionLocatorOf type

#### Signature:

```typescript
export type UnionLocatorOf<T> = T extends Array<Locator<infer S>> ? S : never;
```

**References:** [Locator](./puppeteer.locator.md)
