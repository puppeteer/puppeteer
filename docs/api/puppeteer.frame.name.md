---
sidebar_label: Frame.name
---

# Frame.name() method

**Signature:**

```typescript
class Frame {
  name(): string;
}
```

**Returns:**

string

the frame's `name` attribute as specified in the tag.

## Remarks

If the name is empty, it returns the `id` attribute instead.

Note: This value is calculated once when the frame is created, and will not update if the attribute is changed later.
