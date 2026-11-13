---
sidebar_label: Target.parent
---

# Target.parent() method

Returns the target that Puppeteer attached this target through. For example, the parent of a `"page"` target is the `"tab"` target of its tab. Returns `undefined` for top-level targets, such as `"tab"` targets.

### Signature

```typescript
class Target {
  parent(): Target | undefined;
}
```

**Returns:**

[Target](./puppeteer.target.md) \| undefined

## Remarks

Only supported for Chrome and the CDP protocol. With WebDriver BiDi, returns `undefined`.
