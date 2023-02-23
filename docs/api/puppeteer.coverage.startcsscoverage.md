---
sidebar_label: Coverage.startCSSCoverage
---

# Coverage.startCSSCoverage() method

#### Signature:

```typescript
class Coverage {
  startCSSCoverage(options?: CSSCoverageOptions): Promise<void>;
}
```

## Parameters

| Parameter | Type                                                    | Description                                                                                              |
| --------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| options   | [CSSCoverageOptions](./puppeteer.csscoverageoptions.md) | _(Optional)_ Set of configurable options for coverage, defaults to <code>resetOnNavigation : true</code> |

**Returns:**

Promise&lt;void&gt;

Promise that resolves when coverage is started.
