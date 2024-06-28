---
sidebar_label: Browser.process
---

# Browser.process() method

### Signature:

```typescript
class Browser {
  abstract process(): ChildProcess | null;
}
```

Gets the associated [ChildProcess](https://nodejs.org/api/child_process.html#class-childprocess).

**Returns:**

ChildProcess \| null

`null` if this instance was connected to via [Puppeteer.connect()](./puppeteer.puppeteer.connect.md).
