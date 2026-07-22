---
sidebar_label: InstallPWAOptions
---

# InstallPWAOptions interface

Options for [Browser.installPWA()](./puppeteer.browser.installpwa.md).

### Signature

```typescript
export interface InstallPWAOptions
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

<span id="displaymode">displayMode</span>

</td><td>

`optional`

</td><td>

[PWADisplayMode](./puppeteer.pwadisplaymode.md)

</td><td>

Whether the app should open in a standalone window or a browser tab.

**Remarks:**

`PWA.install` alone leaves the app at Chromium's default display mode (`browser`); setting this chains a `PWA.changeAppUserSettings` call to apply the preference.

</td><td>

</td></tr>
<tr><td>

<span id="installurlorbundleurl">installUrlOrBundleUrl</span>

</td><td>

`optional`

</td><td>

string

</td><td>

The location of the app or bundle overriding the one derived from the `manifestId`.

</td><td>

</td></tr>
<tr><td>

<span id="manifestid">manifestId</span>

</td><td>

</td><td>

string

</td><td>

The id from the web app's manifest file, commonly the URL of the site installing the web app. See [Web app manifest](https://web.dev/learn/pwa/web-app-manifest).

</td><td>

</td></tr>
</tbody></table>
