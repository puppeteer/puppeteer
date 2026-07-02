---
sidebar_label: TimeoutError
---

# TimeoutError class

TimeoutError is emitted whenever certain operations are terminated due to timeout.

### Signature

```typescript
export declare class TimeoutError extends PuppeteerError
```

**Extends:** [PuppeteerError](./puppeteer.puppeteererror.md)

## Remarks

Example operations are [page.waitForSelector](./puppeteer.page.waitforselector.md) or [puppeteer.launch](./puppeteer.puppeteernode.launch.md).
