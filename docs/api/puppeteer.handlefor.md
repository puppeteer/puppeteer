---
sidebar_label: HandleFor
---

# HandleFor type

**Signature:**

```typescript
export declare type HandleFor<T> = T extends Element
  ? ElementHandle<T>
  : JSHandle<T>;
```

**References:** [ElementHandle](./puppeteer.elementhandle.md), [JSHandle](./puppeteer.jshandle.md)
