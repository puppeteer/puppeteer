---
sidebar_label: WaitForSelectorOptions
---

# WaitForSelectorOptions interface

#### Signature:

```typescript
export interface WaitForSelectorOptions
```

## Properties

| Property | Modifiers             | Type        | Description                                                                                                                                                                                            | Default                          |
| -------- | --------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------- |
| hidden   | <code>optional</code> | boolean     | Wait for the selected element to not be found in the DOM or to be hidden, i.e. have <code>display: none</code> or <code>visibility: hidden</code> CSS properties.                                      | <code>false</code>               |
| signal   | <code>optional</code> | AbortSignal | A signal object that allows you to cancel a waitForSelector call.                                                                                                                                      |                                  |
| timeout  | <code>optional</code> | number      | <p>Maximum time to wait in milliseconds. Pass <code>0</code> to disable timeout.</p><p>The default value can be changed by using [Page.setDefaultTimeout()](./puppeteer.page.setdefaulttimeout.md)</p> | <code>30_000</code> (30 seconds) |
| visible  | <code>optional</code> | boolean     | Wait for the selected element to be present in DOM and to be visible, i.e. to not have <code>display: none</code> or <code>visibility: hidden</code> CSS properties.                                   | <code>false</code>               |
