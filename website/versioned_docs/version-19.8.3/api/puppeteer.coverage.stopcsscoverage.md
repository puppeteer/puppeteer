---
sidebar_label: Coverage.stopCSSCoverage
---

# Coverage.stopCSSCoverage() method

Promise that resolves to the array of coverage reports for all stylesheets.

#### Signature:

```typescript
class Coverage {
  stopCSSCoverage(): Promise<CoverageEntry[]>;
}
```

**Returns:**

Promise&lt;[CoverageEntry](./puppeteer.coverageentry.md)\[\]&gt;

## Remarks

CSS Coverage doesn't include dynamically injected style tags without sourceURLs.
