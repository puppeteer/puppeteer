---
sidebar_label: EvaluateFuncWith
---

# EvaluateFuncWith type

### Signature

```typescript
export type EvaluateFuncWith<V, T extends unknown[]> = (
  ...params: [V, ...InnerParams<T>]
) => Awaitable<unknown>;
```

**References:** [InnerParams](./puppeteer.innerparams.md), [Awaitable](./puppeteer.awaitable.md)
