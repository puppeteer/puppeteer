---
sidebar_label: ScreenRecorder.stop
---

# ScreenRecorder.stop() method

Stops the recorder.

### Signature

```typescript
class ScreenRecorder {
  stop(): Promise<void>;
}
```

**Returns:**

Promise&lt;void&gt;

## Remarks

Rejects if ffmpeg fails. A failure that happened before `stop()` was called is still reported, instead of resolving an empty recording.
