---
sidebar_label: Target.opener
---

# Target.opener() method

Get the target that opened this target. Top-level targets return `null`.

Not supported with [WebDriver BiDi](https://pptr.dev/faq#q-what-is-the-status-of-cross-browser-support).

#### Signature:

```typescript
class Target {
  abstract opener(): Target | undefined;
}
```

**Returns:**

[Target](./puppeteer.target.md) \| undefined
