---
sidebar_label: Coverage.stopJSCoverage
---

# Coverage.stopJSCoverage() method

Promise that resolves to the array of coverage reports for all scripts.

### Signature

```typescript
class Coverage {
  stopJSCoverage(): Promise<JSCoverageEntry[]>;
}
```

**Returns:**

Promise&lt;[JSCoverageEntry](./puppeteer.jscoverageentry.md)\[\]&gt;

## Remarks

JavaScript Coverage doesn't include anonymous scripts by default. However, scripts with sourceURLs are reported.
