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

- `Timestamp` : The timestamp when the metrics sample was taken.

- `Documents` : Number of documents in the page.

- `Frames` : Number of frames in the page.

- `JSEventListeners` : Number of events in the page.

- `Nodes` : Number of DOM nodes in the page.

- `LayoutCount` : Total number of full or partial page layout.

- `RecalcStyleCount` : Total number of page style recalculations.

- `LayoutDuration` : Combined durations of all page layouts.

- `RecalcStyleDuration` : Combined duration of all page style recalculations.

- `ScriptDuration` : Combined duration of JavaScript execution.

- `TaskDuration` : Combined duration of all tasks performed by the browser.

- `JSHeapUsedSize` : Used JavaScript heap size.

- `JSHeapTotalSize` : Total JavaScript heap size.

## Remarks

All timestamps are in monotonic time: monotonically increasing time in seconds since an arbitrary point in the past.
