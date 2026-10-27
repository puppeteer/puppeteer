---
sidebar_label: Mapper
---

# Mapper type

### Signature

```typescript
export type Mapper<From, To, Args extends unknown[] = []> = (
  value: From,
  ...args: InnerParams<Args>
) => Awaitable<To>;
```

**References:** [InnerParams](./puppeteer.innerparams.md), [Awaitable](./puppeteer.awaitable.md)
