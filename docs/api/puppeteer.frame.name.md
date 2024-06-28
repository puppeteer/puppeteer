---
sidebar_label: Frame.name
---

# Frame.name() method

### Signature:

```typescript
class Frame {
  name(): string;
}
```

> Warning: This API is now obsolete.
>
> Use
>
> ```ts
> const element = await frame.frameElement();
> const nameOrId = await element.evaluate(frame => frame.name ?? frame.id);
> ```

The frame's `name` attribute as specified in the tag.

**Returns:**

string

## Remarks

This value is calculated once when the frame is created, and will not update if the attribute is changed later.
