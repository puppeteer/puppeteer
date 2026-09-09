---
sidebar_label: Coverage
---

# Coverage class

The Coverage class provides methods to gather information about parts of JavaScript and CSS that were used by the page.

### Signature

```typescript
export declare class Coverage
```

## Remarks

To output coverage in a form consumable by [Istanbul](https://github.com/istanbuljs), see [puppeteer-to-istanbul](https://github.com/istanbuljs/puppeteer-to-istanbul).

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `Coverage` class.

## Example

An example of using JavaScript and CSS coverage to get percentage of initially executed code:

```ts
// Enable both JavaScript and CSS coverage
await Promise.all([
  page.coverage.startJSCoverage(),
  page.coverage.startCSSCoverage(),
]);
// Navigate to page
await page.goto('https://example.com');
// Disable both JavaScript and CSS coverage
const [jsCoverage, cssCoverage] = await Promise.all([
  page.coverage.stopJSCoverage(),
  page.coverage.stopCSSCoverage(),
]);
let totalBytes = 0;
let usedBytes = 0;
const coverage = [...jsCoverage, ...cssCoverage];
for (const entry of coverage) {
  totalBytes += entry.text.length;
  for (const range of entry.ranges) usedBytes += range.end - range.start - 1;
}
console.log(`Bytes used: ${(usedBytes / totalBytes) * 100}%`);
```

## Methods

<table><thead><tr><th>

Method

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

<span id="startcsscoverage">[startCSSCoverage(options)](./puppeteer.coverage.startcsscoverage.md)</span>

</td><td>

</td><td>

</td></tr>
<tr><td>

<span id="startjscoverage">[startJSCoverage(options)](./puppeteer.coverage.startjscoverage.md)</span>

</td><td>

</td><td>

**Remarks:**

Anonymous scripts are ones that don't have an associated url. These are scripts that are dynamically created on the page using `eval` or `new Function`. If `reportAnonymousScripts` is set to `true`, anonymous scripts URL will start with `debugger://VM` (unless a magic //\# sourceURL comment is present, in which case that will the be URL).

</td></tr>
<tr><td>

<span id="stopcsscoverage">[stopCSSCoverage()](./puppeteer.coverage.stopcsscoverage.md)</span>

</td><td>

</td><td>

Promise that resolves to the array of coverage reports for all stylesheets.

**Remarks:**

CSS Coverage doesn't include dynamically injected style tags without sourceURLs.

</td></tr>
<tr><td>

<span id="stopjscoverage">[stopJSCoverage()](./puppeteer.coverage.stopjscoverage.md)</span>

</td><td>

</td><td>

Promise that resolves to the array of coverage reports for all scripts.

**Remarks:**

JavaScript Coverage doesn't include anonymous scripts by default. However, scripts with sourceURLs are reported.

</td></tr>
</tbody></table>
