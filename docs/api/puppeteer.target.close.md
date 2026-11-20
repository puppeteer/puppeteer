---
sidebar_label: Target.close
---

# Target.close() method

Closes the target.

### Signature

```typescript
class Target {
  abstract close(): Promise<void>;
}
```

**Returns:**

Promise&lt;void&gt;

## Remarks

It does not create a [Page](./puppeteer.page.md) for the target, so it also closes a page target whose page could not be created. It does not run `beforeunload` handlers.

Throws if the target does not support closing, for example the browser target, the target of a frame or a dedicated worker.
