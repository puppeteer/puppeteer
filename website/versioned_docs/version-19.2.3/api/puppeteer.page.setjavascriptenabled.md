---
sidebar_label: Page.setJavaScriptEnabled
---

# Page.setJavaScriptEnabled() method

#### Signature:

```typescript
class Page {
  setJavaScriptEnabled(enabled: boolean): Promise<void>;
}
```

## Parameters

| Parameter | Type    | Description                                      |
| --------- | ------- | ------------------------------------------------ |
| enabled   | boolean | Whether or not to enable JavaScript on the page. |

**Returns:**

Promise&lt;void&gt;

## Remarks

NOTE: changing this value won't affect scripts that have already been run. It will take full effect on the next navigation.
