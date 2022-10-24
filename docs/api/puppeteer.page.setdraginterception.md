---
sidebar_label: Page.setDragInterception
---

# Page.setDragInterception() method

#### Signature:

```typescript
class Page {
  setDragInterception(enabled: boolean): Promise<void>;
}
```

## Parameters

| Parameter | Type    | Description                          |
| --------- | ------- | ------------------------------------ |
| enabled   | boolean | Whether to enable drag interception. |

**Returns:**

Promise&lt;void&gt;

## Remarks

Activating drag interception enables the `Input.drag`, methods This provides the capability to capture drag events emitted on the page, which can then be used to simulate drag-and-drop.
