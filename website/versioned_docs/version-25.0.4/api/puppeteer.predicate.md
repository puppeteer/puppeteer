---
sidebar_label: Predicate
---

# Predicate type

### Signature

```typescript
export type Predicate<From, To extends From = From> =
  | ((value: From) => value is To)
  | ((value: From) => Awaitable<boolean>);
```

**References:** [Awaitable](./puppeteer.awaitable.md)
