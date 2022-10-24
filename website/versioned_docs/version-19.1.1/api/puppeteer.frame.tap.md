---
sidebar_label: Frame.tap
---

# Frame.tap() method

Taps the first element that matches the `selector`.

#### Signature:

```typescript
class Frame {
  tap(selector: string): Promise<void>;
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
