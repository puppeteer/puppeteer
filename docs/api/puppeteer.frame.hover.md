---
sidebar_label: Frame.hover
---

# Frame.hover() method

Hovers the pointer over the center of the first element that matches the `selector`.

#### Signature:

```typescript
class Frame &#123;hover(selector: string): Promise<void>;&#125;
```

## Parameters

| Parameter | Type   | Description                |
| --------- | ------ | -------------------------- |
| selector  | string | The selector to query for. |

**Returns:**

Promise&lt;void&gt;

## Exceptions

Throws if there's no element matching `selector`.
