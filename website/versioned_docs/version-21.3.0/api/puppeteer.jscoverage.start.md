---
sidebar_label: JSCoverage.start
---

# JSCoverage.start() method

#### Signature:

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

| Parameter | Type                                                                                                                               | Description  |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| options   | { resetOnNavigation?: boolean; reportAnonymousScripts?: boolean; includeRawScriptCoverage?: boolean; useBlockCoverage?: boolean; } | _(Optional)_ |

**Returns:**

Promise&lt;void&gt;
