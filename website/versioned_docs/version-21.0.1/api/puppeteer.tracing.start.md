---
sidebar_label: Tracing.start
---

# Tracing.start() method

Starts a trace for the current page.

#### Signature:

```typescript
class Tracing {
  start(options?: TracingOptions): Promise<void>;
}
```

## Parameters

| Parameter | Type                                            | Description                                        |
| --------- | ----------------------------------------------- | -------------------------------------------------- |
| options   | [TracingOptions](./puppeteer.tracingoptions.md) | _(Optional)_ Optional <code>TracingOptions</code>. |

**Returns:**

Promise&lt;void&gt;

## Remarks

Only one trace can be active at a time per browser.
