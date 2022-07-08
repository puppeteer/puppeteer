---
sidebar_label: ScreenshotOptions.path
---

# ScreenshotOptions.path property

The file path to save the image to. The screenshot type will be inferred from file extension. If path is a relative path, then it is resolved relative to current working directory. If no path is provided, the image won't be saved to the disk.

**Signature:**

```typescript
interface ScreenshotOptions {
  path?: string;
}
```
