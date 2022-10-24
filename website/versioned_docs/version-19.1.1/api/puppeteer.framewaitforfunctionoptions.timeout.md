---
sidebar_label: FrameWaitForFunctionOptions.timeout
---

# FrameWaitForFunctionOptions.timeout property

Maximum time to wait in milliseconds. Defaults to `30000` (30 seconds). Pass `0` to disable the timeout. Puppeteer's default timeout can be changed using [Page.setDefaultTimeout()](./puppeteer.page.setdefaulttimeout.md).

#### Signature:

```typescript
interface FrameWaitForFunctionOptions {
  timeout?: number;
}
```
