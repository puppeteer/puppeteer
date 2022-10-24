---
sidebar_label: WaitForSelectorOptions
---

# WaitForSelectorOptions interface

#### Signature:

```typescript
export interface WaitForSelectorOptions
```

## Properties

| Property                                                  | Modifiers | Type    | Description                                                                                                                                                                                                              | Default                         |
| --------------------------------------------------------- | --------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------- |
| [hidden?](./puppeteer.waitforselectoroptions.hidden.md)   |           | boolean | <i>(Optional)</i> Wait for the selected element to not be found in the DOM or to be hidden, i.e. have <code>display: none</code> or <code>visibility: hidden</code> CSS properties.                                      | <code>false</code>              |
| [timeout?](./puppeteer.waitforselectoroptions.timeout.md) |           | number  | <p><i>(Optional)</i> Maximum time to wait in milliseconds. Pass <code>0</code> to disable timeout.</p><p>The default value can be changed by using [Page.setDefaultTimeout()](./puppeteer.page.setdefaulttimeout.md)</p> | <code>30000</code> (30 seconds) |
| [visible?](./puppeteer.waitforselectoroptions.visible.md) |           | boolean | <i>(Optional)</i> Wait for the selected element to be present in DOM and to be visible, i.e. to not have <code>display: none</code> or <code>visibility: hidden</code> CSS properties.                                   | <code>false</code>              |
