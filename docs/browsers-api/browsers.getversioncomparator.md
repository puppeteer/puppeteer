---
sidebar_label: getVersionComparator
---

# getVersionComparator() function

Returns a version comparator for the given browser that can be used to sort browser versions.

#### Signature:

```typescript
export declare function getVersionComparator(
  browser: Browser
): (a: string, b: string) => number;
```

## Parameters

| Parameter | Type                             | Description |
| --------- | -------------------------------- | ----------- |
| browser   | [Browser](./browsers.browser.md) |             |

**Returns:**

(a: string, b: string) =&gt; number
