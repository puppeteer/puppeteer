---
sidebar_label: makeProgressCallback
---

# makeProgressCallback() function

### Signature

```typescript
export declare function makeProgressCallback(
  browser: Browser,
  buildId: string,
): Promise<(downloadedBytes: number, totalBytes: number) => void>;
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

browser

</td><td>

[Browser](./browsers.browser.md)

</td><td>

</td></tr>
<tr><td>

buildId

</td><td>

string

</td><td>

</td></tr>
</tbody></table>
**Returns:**

Promise&lt;(downloadedBytes: number, totalBytes: number) =&gt; void&gt;
