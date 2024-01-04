---
sidebar_label: Frame.hover
---

# Frame.hover() method

Hovers the pointer over the center of the first element that matches the `selector`.

#### Signature:

```typescript
class Frame {
  hover(selector: string): Promise<void>;
}
```

## Parameters

| Parameter | Type   | Description                |
| --------- | ------ | -------------------------- |
| selector  | string | The selector to query for. |

**Returns:**

Promise&lt;void&gt;

## Exceptions

Throws if there's no element matching `selector`.
