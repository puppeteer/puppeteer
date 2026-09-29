---
sidebar_label: ConsoleMessage.page
---

# ConsoleMessage.page() method

The [Page](./puppeteer.page.md) that the console message originated from, or `null` if the message originated from a worker or outside of a frame context.

### Signature

```typescript
class ConsoleMessage {
  page(): Page | null;
}
```

**Returns:**

[Page](./puppeteer.page.md) \| null
