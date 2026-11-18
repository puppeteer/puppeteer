---
sidebar_label: Target.asPage
---

# Target.asPage() method

Forcefully creates a page for an arbitrary target. It is useful if you want to handle a CDP target of type `other` as a page. If you deal with a regular page target, use [Target.page()](./puppeteer.target.page.md).

### Signature

```typescript
class Target {
  abstract asPage(): Promise<Page>;
}
```

**Returns:**

Promise&lt;[Page](./puppeteer.page.md)&gt;

## Exceptions

Throws if the target is [discarded](./puppeteer.target.isdiscarded.md) or of type ["tab"](./puppeteer.targettype.md).
