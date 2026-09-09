---
sidebar_label: Coverage.startCSSCoverage
---

# Coverage.startCSSCoverage() method

### Signature

```typescript
class Coverage {
  startCSSCoverage(options?: CSSCoverageOptions): Promise<void>;
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

[CSSCoverageOptions](./puppeteer.csscoverageoptions.md)

</td><td>

_(Optional)_ Set of configurable options for coverage, defaults to `resetOnNavigation : true`

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;void&gt;

Promise that resolves when coverage is started.
