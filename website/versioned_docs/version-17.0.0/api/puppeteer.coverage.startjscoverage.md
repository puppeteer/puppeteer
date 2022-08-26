---
sidebar_label: Coverage.startJSCoverage
---

# Coverage.startJSCoverage() method

**Signature:**

```typescript
class Coverage {
  startJSCoverage(options?: JSCoverageOptions): Promise<void>;
}
```

## Parameters

| Parameter | Type                                                  | Description                                                                                                                                  |
| --------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| options   | [JSCoverageOptions](./puppeteer.jscoverageoptions.md) | <i>(Optional)</i> Set of configurable options for coverage defaults to <code>resetOnNavigation : true, reportAnonymousScripts : false</code> |

**Returns:**

Promise&lt;void&gt;

Promise that resolves when coverage is started.

## Remarks

Anonymous scripts are ones that don't have an associated url. These are scripts that are dynamically created on the page using `eval` or `new Function`. If `reportAnonymousScripts` is set to `true`, anonymous scripts will have `pptr://__puppeteer_evaluation_script__` as their URL.
