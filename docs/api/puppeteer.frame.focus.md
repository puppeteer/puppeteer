---
sidebar_label: Frame.focus
---

# Frame.focus() method

This method fetches an element with `selector` and focuses it.

**Signature:**

```typescript
class Frame {
  focus(selector: string): Promise<void>;
}
```

## Parameters

| Parameter | Type   | Description                                                                                       |
| --------- | ------ | ------------------------------------------------------------------------------------------------- |
| selector  | string | the selector for the element to focus. If there are multiple elements, the first will be focused. |

**Returns:**

Promise&lt;void&gt;

## Remarks

If there's no element matching `selector`, the method throws an error.
