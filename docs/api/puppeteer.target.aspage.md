---
sidebar_label: Target.asPage
---

# Target.asPage() method

### Signature:

```typescript
class Target {
  abstract asPage(): Promise<Page>;
}
```

Forcefully creates a page for a target of any type. It is useful if you want to handle a CDP target of type `other` as a page. If you deal with a regular page target, use [Target.page()](./puppeteer.target.page.md).

**Returns:**

Promise&lt;[Page](./puppeteer.page.md)&gt;
