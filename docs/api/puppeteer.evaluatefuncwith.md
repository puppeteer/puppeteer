---
sidebar_label: EvaluateFuncWith
---

# EvaluateFuncWith type

### Signature

```typescript
export declare type EvaluateFuncWith<V, T extends unknown[]> = (
  ...params: [V, ...InnerParams<T>]
) => Awaitable<unknown>;
```

**References:** [InnerParams](./puppeteer.innerparams.md), [Awaitable](./puppeteer.awaitable.md)
