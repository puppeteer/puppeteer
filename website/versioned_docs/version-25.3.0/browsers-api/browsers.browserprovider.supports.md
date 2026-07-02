---
sidebar_label: BrowserProvider.supports
---

# BrowserProvider.supports() method

Check if this provider supports the given browser/platform. Used for filtering before attempting downloads.

Can be synchronous for quick checks or asynchronous if version resolution/network requests are needed.

### Signature

```typescript
interface BrowserProvider {
  supports(options: DownloadOptions): Promise<boolean> | boolean;
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

[DownloadOptions](./browsers.downloadoptions.md)

</td><td>

Download options to check

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;boolean&gt; \| boolean

True if this provider supports the browser/platform combination
