---
sidebar_label: AwaitedLocator
---

# AwaitedLocator type

### Signature

```typescript
export declare type AwaitedLocator<T> = T extends Locator<infer S> ? S : never;
```

**References:** [Locator](./puppeteer.locator.md)
