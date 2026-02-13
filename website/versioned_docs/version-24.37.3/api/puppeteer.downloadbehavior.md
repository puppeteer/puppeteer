---
sidebar_label: DownloadBehavior
---

# DownloadBehavior interface

### Signature

```typescript
export interface DownloadBehavior
```

## Properties

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th><th>

Default

</th></tr></thead>
<tbody><tr><td>

<span id="downloadpath">downloadPath</span>

</td><td>

`optional`

</td><td>

string

</td><td>

The default path to save downloaded files to.

**Remarks:**

Setting this is required if behavior is set to `allow` or `allowAndName`.

</td><td>

</td></tr>
<tr><td>

<span id="policy">policy</span>

</td><td>

</td><td>

[DownloadPolicy](./puppeteer.downloadpolicy.md)

</td><td>

Whether to allow all or deny all download requests, or use default behavior if available.

**Remarks:**

Setting this to `allowAndName` will name all files according to their download guids.

</td><td>

</td></tr>
</tbody></table>
