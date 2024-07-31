---
sidebar_label: FlattenHandle
---

# FlattenHandle type

### Signature

```typescript
export type FlattenHandle<T> = T extends HandleOr<infer U> ? U : never;
```

**References:** [HandleOr](./puppeteer.handleor.md)
