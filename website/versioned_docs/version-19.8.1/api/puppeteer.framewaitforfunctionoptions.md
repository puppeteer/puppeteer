---
sidebar_label: FrameWaitForFunctionOptions
---

# FrameWaitForFunctionOptions interface

#### Signature:

```typescript
export interface FrameWaitForFunctionOptions
```

## Properties

| Property                                                       | Modifiers | Type                          | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Default |
| -------------------------------------------------------------- | --------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| [polling?](./puppeteer.framewaitforfunctionoptions.polling.md) |           | 'raf' \| 'mutation' \| number | <p>_(Optional)_ An interval at which the <code>pageFunction</code> is executed, defaults to <code>raf</code>. If <code>polling</code> is a number, then it is treated as an interval in milliseconds at which the function would be executed. If <code>polling</code> is a string, then it can be one of the following values:</p><p>- <code>raf</code> - to constantly execute <code>pageFunction</code> in <code>requestAnimationFrame</code> callback. This is the tightest polling mode which is suitable to observe styling changes.</p><p>- <code>mutation</code> - to execute <code>pageFunction</code> on every DOM mutation.</p> |         |
| [timeout?](./puppeteer.framewaitforfunctionoptions.timeout.md) |           | number                        | _(Optional)_ Maximum time to wait in milliseconds. Defaults to <code>30000</code> (30 seconds). Pass <code>0</code> to disable the timeout. Puppeteer's default timeout can be changed using [Page.setDefaultTimeout()](./puppeteer.page.setdefaulttimeout.md).                                                                                                                                                                                                                                                                                                                                                                           |         |
