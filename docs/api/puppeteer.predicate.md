---
sidebar_label: Predicate
---

# Predicate type

### Signature

```typescript
export type Predicate<
  From,
  To extends From = From,
  Args extends unknown[] = [],
> =
  | ((value: From, ...args: InnerParams<Args>) => value is To)
  | ((value: From, ...args: InnerParams<Args>) => Awaitable<boolean>);
```

**References:** [InnerParams](./puppeteer.innerparams.md), [Awaitable](./puppeteer.awaitable.md)
