---
sidebar_label: WaitTimeoutOptions.timeout
---

# WaitTimeoutOptions.timeout property

Maximum wait time in milliseconds. Pass 0 to disable the timeout.

The default value can be changed by using the [Page.setDefaultTimeout()](./puppeteer.page.setdefaulttimeout.md) method.

#### Signature:

```typescript
interface WaitTimeoutOptions {
  timeout?: number;
}
```

#### Default value:

`30000`
