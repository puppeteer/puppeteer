---
sidebar_label: TimeoutError
---

# TimeoutError class

### Signature:

```typescript
export declare class TimeoutError extends PuppeteerError
```

**Extends:** [PuppeteerError](./puppeteer.puppeteererror.md)

TimeoutError is emitted whenever certain operations are terminated due to timeout.

## Remarks

Example operations are [page.waitForSelector](./puppeteer.page.waitforselector.md) or [puppeteer.launch](./puppeteer.puppeteernode.launch.md).
