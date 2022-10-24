---
sidebar_label: Browser.process
---

# Browser.process() method

The spawned browser process. Returns `null` if the browser instance was created with [Puppeteer.connect()](./puppeteer.puppeteer.connect.md).

#### Signature:

```typescript
class Browser {
  process(): ChildProcess | null;
}
```

**Returns:**

ChildProcess \| null
