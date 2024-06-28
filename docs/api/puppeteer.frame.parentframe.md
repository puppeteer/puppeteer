---
sidebar_label: Frame.parentFrame
---

# Frame.parentFrame() method

### Signature:

```typescript
class Frame {
  abstract parentFrame(): Frame | null;
}
```

The parent frame, if any. Detached and main frames return `null`.

**Returns:**

[Frame](./puppeteer.frame.md) \| null
