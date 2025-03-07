---
sidebar_label: getVersionComparator
---

# getVersionComparator() function

Returns a version comparator for the given browser that can be used to sort browser versions.

### Signature

```typescript
export declare function getVersionComparator(
  browser: Browser,
): (a: string, b: string) => number;
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
</tbody></table>
**Returns:**

(a: string, b: string) =&gt; number
