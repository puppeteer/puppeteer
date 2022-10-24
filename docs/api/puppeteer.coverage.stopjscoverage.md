---
sidebar_label: Coverage.stopJSCoverage
---

# Coverage.stopJSCoverage() method

#### Signature:

```typescript
class Coverage {
  stopJSCoverage(): Promise<JSCoverageEntry[]>;
}
```

**Returns:**

Promise&lt;[JSCoverageEntry](./puppeteer.jscoverageentry.md)\[\]&gt;

Promise that resolves to the array of coverage reports for all scripts.

## Remarks

JavaScript Coverage doesn't include anonymous scripts by default. However, scripts with sourceURLs are reported.
