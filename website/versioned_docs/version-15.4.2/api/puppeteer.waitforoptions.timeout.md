---
sidebar_label: WaitForOptions.timeout
---

# WaitForOptions.timeout property

Maximum wait time in milliseconds, defaults to 30 seconds, pass `0` to disable the timeout.

**Signature:**

```typescript
interface WaitForOptions {
  timeout?: number;
}
```

## Remarks

The default value can be changed by using the [Page.setDefaultTimeout()](./puppeteer.page.setdefaulttimeout.md) or [Page.setDefaultNavigationTimeout()](./puppeteer.page.setdefaultnavigationtimeout.md) methods.
