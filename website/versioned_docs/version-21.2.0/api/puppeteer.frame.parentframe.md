---
sidebar_label: Frame.parentFrame
---

# Frame.parentFrame() method

The parent frame, if any. Detached and main frames return `null`.

#### Signature:

```typescript
class Frame {
  abstract parentFrame(): Frame | null;
}
```

**Returns:**

[Frame](./puppeteer.frame.md) \| null
