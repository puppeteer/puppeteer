---
sidebar_label: Target.asPage
---

# Target.asPage() method

Forcefully creates a page for a target of any type. It is useful if you want to handle a CDP target of type `other` as a page. If you deal with a regular page target, use [Target.page()](./puppeteer.target.page.md).

### Signature

```typescript
class Target {
  abstract asPage(): Promise<Page>;
}
```

**Returns:**

Promise&lt;[Page](./puppeteer.page.md)&gt;

## Remarks

For a `"tab"` target, forces a page for the child target that shows the content of the tab, and throws if the tab has no such child yet. Throws for a target with the `"prerender"` [subtype](./puppeteer.target.subtype.md).
