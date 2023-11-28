---
sidebar_label: Browser.process
---

# Browser.process() method

Gets the associated [ChildProcess](https://nodejs.org/api/child_process.html#class-childprocess).

#### Signature:

```typescript
class Browser {
  abstract process(): ChildProcess | null;
}
```

**Returns:**

ChildProcess \| null

`null` if this instance was connected to via [Puppeteer.connect()](./puppeteer.puppeteer.connect.md).
