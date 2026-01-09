---
sidebar_label: Coverage.startJSCoverage
---

# Coverage.startJSCoverage() method

### Signature

```typescript
class Coverage {
  startJSCoverage(options?: JSCoverageOptions): Promise<void>;
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

[JSCoverageOptions](./puppeteer.jscoverageoptions.md)

</td><td>

_(Optional)_ Set of configurable options for coverage defaults to `resetOnNavigation : true, reportAnonymousScripts : false,` `includeRawScriptCoverage : false, useBlockCoverage : true`

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;void&gt;

Promise that resolves when coverage is started.

## Remarks

Anonymous scripts are ones that don't have an associated url. These are scripts that are dynamically created on the page using `eval` or `new Function`. If `reportAnonymousScripts` is set to `true`, anonymous scripts URL will start with `debugger://VM` (unless a magic //\# sourceURL comment is present, in which case that will the be URL).
