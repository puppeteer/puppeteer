---
sidebar_label: HandleFor
---

# HandleFor type

#### Signature:

```typescript
export type HandleFor<T> = T extends Node ? ElementHandle<T> : JSHandle<T>;
```

**References:** [ElementHandle](./puppeteer.elementhandle.md), [JSHandle](./puppeteer.jshandle.md)
