---
sidebar_label: Target.opener
---

# Target.opener() method

### Signature:

```typescript
class Target {
  abstract opener(): Target | undefined;
}
```

Get the target that opened this target. Top-level targets return `null`.

**Returns:**

[Target](./puppeteer.target.md) \| undefined
