---
sidebar_label: Frame.parentFrame
---

# Frame.parentFrame() method

#### Signature:

```typescript
class Frame {
  parentFrame(): Frame | null;
}
```

**Returns:**

[Frame](./puppeteer.frame.md) \| null

The parent frame, if any. Detached and main frames return `null`.
