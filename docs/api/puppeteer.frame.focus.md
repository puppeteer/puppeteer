---
sidebar_label: Frame.focus
---

# Frame.focus() method

Focuses the first element that matches the `selector`.

#### Signature:

```typescript
class Frame &#123;focus(selector: string): Promise<void>;&#125;
```

## Parameters

| Parameter | Type   | Description                |
| --------- | ------ | -------------------------- |
| selector  | string | The selector to query for. |

**Returns:**

Promise&lt;void&gt;

## Exceptions

Throws if there's no element matching `selector`.
