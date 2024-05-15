---
sidebar_label: EvaluateFunc
---

# EvaluateFunc type

#### Signature:

```typescript
export type EvaluateFunc<T extends unknown[]> = (
  ...params: InnerParams<T>
) => Awaitable<unknown>;
```

**References:** [InnerParams](./puppeteer.innerparams.md), [Awaitable](./puppeteer.awaitable.md)
