---
sidebar_label: Tracing.start
---

# Tracing.start() method

Starts a trace for the current page.

### Signature

```typescript
class Tracing {
  start(options?: TracingOptions): Promise<void>;
}
```

## Parameters

<table><thead><tr><th>

Parameter

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

options

</td><td>

[TracingOptions](./puppeteer.tracingoptions.md)

</td><td>

_(Optional)_ Optional `TracingOptions`.

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;void&gt;

## Remarks

Only one trace can be active at a time per browser.
