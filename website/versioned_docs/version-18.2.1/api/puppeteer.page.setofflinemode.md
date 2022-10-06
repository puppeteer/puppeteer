---
sidebar_label: Page.setOfflineMode
---

# Page.setOfflineMode() method

**Signature:**

```typescript
class Page {
  setOfflineMode(enabled: boolean): Promise<void>;
}
```

## Parameters

| Parameter | Type    | Description                                                |
| --------- | ------- | ---------------------------------------------------------- |
| enabled   | boolean | When <code>true</code>, enables offline mode for the page. |

**Returns:**

Promise&lt;void&gt;

## Remarks

NOTE: while this method sets the network connection to offline, it does not change the parameters used in \[page.emulateNetworkConditions(networkConditions)\] (\#pageemulatenetworkconditionsnetworkconditions)
