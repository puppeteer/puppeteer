---
sidebar_label: Coverage.stopCSSCoverage
---

# Coverage.stopCSSCoverage() method

Promise that resolves to the array of coverage reports for all stylesheets.

#### Signature:

```typescript
class Coverage &#123;stopCSSCoverage(): Promise<CoverageEntry[]>;&#125;
```

**Returns:**

Promise&lt;[CoverageEntry](./puppeteer.coverageentry.md)\[\]&gt;

## Remarks

CSS Coverage doesn't include dynamically injected style tags without sourceURLs.
