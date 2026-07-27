---
sidebar_label: getDownloadUrl
---

# getDownloadUrl() function

Retrieves a URL for downloading the binary archive of a given browser.

The archive is bound to the specific platform and build ID specified.

### Signature

```typescript
export declare function getDownloadUrl(
  browser: Browser,
  platform: BrowserPlatform,
  buildId: string,
  baseUrl?: string,
): URL;
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

platform

</td><td>

[BrowserPlatform](./browsers.browserplatform.md)

</td><td>

</td></tr>
<tr><td>

buildId

</td><td>

string

</td><td>

</td></tr>
<tr><td>

baseUrl

</td><td>

string

</td><td>

_(Optional)_

</td></tr>
</tbody></table>

**Returns:**

URL
