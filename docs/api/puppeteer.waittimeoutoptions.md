---
sidebar_label: WaitTimeoutOptions
---

# WaitTimeoutOptions interface

#### Signature:

```typescript
export interface WaitTimeoutOptions
```

## Properties

| Property | Modifiers             | Type   | Description                                                                                                                                                                                            | Default            |
| -------- | --------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------ |
| timeout  | <code>optional</code> | number | <p>Maximum wait time in milliseconds. Pass 0 to disable the timeout.</p><p>The default value can be changed by using the [Page.setDefaultTimeout()](./puppeteer.page.setdefaulttimeout.md) method.</p> | <code>30000</code> |
