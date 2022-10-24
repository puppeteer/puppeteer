---
sidebar_label: WaitForOptions
---

# WaitForOptions interface

#### Signature:

```typescript
export interface WaitForOptions
```

## Properties

| Property                                              | Modifiers | Type                                                                                                                                       | Description                                                                                                                                                                                                                                                                                                        | Default            |
| ----------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------ |
| [timeout?](./puppeteer.waitforoptions.timeout.md)     |           | number                                                                                                                                     | <p><i>(Optional)</i> Maximum wait time in milliseconds. Pass 0 to disable the timeout.</p><p>The default value can be changed by using the [Page.setDefaultTimeout()](./puppeteer.page.setdefaulttimeout.md) or [Page.setDefaultNavigationTimeout()](./puppeteer.page.setdefaultnavigationtimeout.md) methods.</p> | <code>30000</code> |
| [waitUntil?](./puppeteer.waitforoptions.waituntil.md) |           | [PuppeteerLifeCycleEvent](./puppeteer.puppeteerlifecycleevent.md) \| [PuppeteerLifeCycleEvent](./puppeteer.puppeteerlifecycleevent.md)\[\] | <i>(Optional)</i>                                                                                                                                                                                                                                                                                                  |                    |
