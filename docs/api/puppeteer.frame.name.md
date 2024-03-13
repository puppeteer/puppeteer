---
sidebar_label: Frame.name
---

# Frame.name() method

> Warning: This API is now obsolete.
>
> Use
>
> ```ts
> const element = await frame.frameElement();
> const name = await element.evaluate(frame => frame.name);
> ```

The frame's `name` attribute as specified in the tag.

#### Signature:

```typescript
class Frame {
  name(): string;
}
```

**Returns:**

string

## Remarks

This value is calculated once when the frame is created, and will not update if the attribute is changed later.
