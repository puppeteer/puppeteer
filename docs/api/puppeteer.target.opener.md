---
sidebar_label: Target.opener
---

# Target.opener() method

Get the target that opened this target. Top-level targets return `null`.

### Signature

```typescript
class Target {
  abstract opener(): Target | undefined;
}
```

**Returns:**

[Target](./puppeteer.target.md) \| undefined
