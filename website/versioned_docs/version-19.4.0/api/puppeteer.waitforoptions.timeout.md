---
sidebar_label: WaitForOptions.timeout
---

# WaitForOptions.timeout property

Maximum wait time in milliseconds. Pass 0 to disable the timeout.

The default value can be changed by using the [Page.setDefaultTimeout()](./puppeteer.page.setdefaulttimeout.md) or [Page.setDefaultNavigationTimeout()](./puppeteer.page.setdefaultnavigationtimeout.md) methods.

#### Signature:

```typescript
interface WaitForOptions {
  timeout?: number;
}
```

#### Default value:

`30000`
