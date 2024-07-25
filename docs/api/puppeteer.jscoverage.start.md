---
sidebar_label: JSCoverage.start
---

# JSCoverage.start() method

### Signature

```typescript
class JSCoverage {
  start(options?: {
    resetOnNavigation?: boolean;
    reportAnonymousScripts?: boolean;
    includeRawScriptCoverage?: boolean;
    useBlockCoverage?: boolean;
  }): Promise<void>;
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

&#123; resetOnNavigation?: boolean; reportAnonymousScripts?: boolean; includeRawScriptCoverage?: boolean; useBlockCoverage?: boolean; &#125;

</td><td>

_(Optional)_

</td></tr>
</tbody></table>
**Returns:**

Promise&lt;void&gt;
