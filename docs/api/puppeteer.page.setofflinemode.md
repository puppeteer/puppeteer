---
sidebar_label: Page.setOfflineMode
---

# Page.setOfflineMode() method

Sets the network connection to offline.

It does not change the parameters used in [Page.emulateNetworkConditions()](./puppeteer.page.emulatenetworkconditions.md)

#### Signature:

```typescript
class Page {
  abstract setOfflineMode(enabled: boolean): Promise<void>;
}
```

## Parameters

| Parameter | Type    | Description                                                |
| --------- | ------- | ---------------------------------------------------------- |
| enabled   | boolean | When <code>true</code>, enables offline mode for the page. |

**Returns:**

Promise&lt;void&gt;

## Remarks

Not supported with [WebDriver BiDi](https://pptr.dev/faq#q-what-is-the-status-of-cross-browser-support).
