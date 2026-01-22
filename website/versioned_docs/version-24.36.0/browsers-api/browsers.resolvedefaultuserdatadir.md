---
sidebar_label: resolveDefaultUserDataDir
---

# resolveDefaultUserDataDir() function

Returns the expected default user data dir for the given channel. It does not check if the dir actually exists.

### Signature

```typescript
export declare function resolveDefaultUserDataDir(
  browser: Browser,
  platform: BrowserPlatform,
  channel: ChromeReleaseChannel,
): string;
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

channel

</td><td>

[ChromeReleaseChannel](./browsers.chromereleasechannel.md)

</td><td>

</td></tr>
</tbody></table>

**Returns:**

string
