---
sidebar_label: Page.metrics
---

# Page.metrics() method

Object containing metrics as key/value pairs.

### Signature

```typescript
class Page {
  abstract metrics(): Promise<Metrics>;
}
```

**Returns:**

Promise&lt;[Metrics](./puppeteer.metrics.md)&gt;

- `Timestamp` : The timestamp when the metrics sample was taken, in monotonic time (seconds).

- `Documents` : Number of documents in the page.

- `Frames` : Number of frames in the page.

- `JSEventListeners` : Number of events in the page.

- `Nodes` : Number of DOM nodes in the page.

- `LayoutCount` : Total number of full or partial page layout.

- `RecalcStyleCount` : Total number of page style recalculations.

- `LayoutDuration` : Combined durations of all page layouts, in seconds.

- `RecalcStyleDuration` : Combined duration of all page style recalculations, in seconds.

- `ScriptDuration` : Combined duration of JavaScript execution, in seconds.

- `TaskDuration` : Combined duration of all tasks performed by the browser, in seconds.

- `JSHeapUsedSize` : Used JavaScript heap size, in bytes.

- `JSHeapTotalSize` : Total JavaScript heap size, in bytes.

## Remarks

All timestamps are in monotonic time: monotonically increasing time in seconds since an arbitrary point in the past.
