---
sidebar_label: Coverage.stopJSCoverage
---

# Coverage.stopJSCoverage() method

Promise that resolves to the array of coverage reports for all scripts.

#### Signature:

```typescript
class Coverage &#123;stopJSCoverage(): Promise<JSCoverageEntry[]>;&#125;
```

**Returns:**

Promise&lt;[JSCoverageEntry](./puppeteer.jscoverageentry.md)\[\]&gt;

## Remarks

JavaScript Coverage doesn't include anonymous scripts by default. However, scripts with sourceURLs are reported.
