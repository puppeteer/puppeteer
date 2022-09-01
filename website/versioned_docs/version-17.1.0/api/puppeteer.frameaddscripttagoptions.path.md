---
sidebar_label: FrameAddScriptTagOptions.path
---

# FrameAddScriptTagOptions.path property

The path to a JavaScript file to be injected into the frame.

**Signature:**

```typescript
interface FrameAddScriptTagOptions {
  path?: string;
}
```

## Remarks

If `path` is a relative path, it is resolved relative to the current working directory (`process.cwd()` in Node.js).
