---
sidebar_label: BrowserProvider.getDownloadUrl
---

# BrowserProvider.getDownloadUrl() method

Get the download URL for the requested browser.

The buildId can be either an exact version (e.g., "131.0.6778.109") or an alias (e.g., "latest", "stable"). Custom providers should handle version resolution internally if they support aliases.

Returns null if the buildId cannot be resolved to a valid version. The URL is not validated - download will fail later if URL doesn't exist.

Can be synchronous for simple URL construction or asynchronous if version resolution/network requests are needed.

### Signature

```typescript
interface BrowserProvider {
  getDownloadUrl(options: DownloadOptions): Promise<URL | null> | URL | null;
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

Download options (buildId may be alias or exact version)

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;URL \| null&gt; \| URL \| null

Download URL, or null if version cannot be resolved

## Example

```ts
// Synchronous example
getDownloadUrl(options) {
  const platform = mapPlatform(options.platform);
  return new URL(`https://releases.example.com/v${options.buildId}/${platform}.zip`);
}

// Asynchronous example with version mapping
async getDownloadUrl(options) {
  const electronVersion = await resolveElectronVersion(options.buildId);
  if (!electronVersion) return null;

  const platform = mapPlatform(options.platform);
  return new URL(`https://github.com/electron/electron/releases/download/v${electronVersion}/${platform}.zip`);
}
```
