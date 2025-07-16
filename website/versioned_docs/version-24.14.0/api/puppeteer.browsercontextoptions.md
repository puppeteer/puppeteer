---
sidebar_label: BrowserContextOptions
---

# BrowserContextOptions interface

### Signature

```typescript
export interface BrowserContextOptions
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

<span id="downloadbehavior">downloadBehavior</span>

</td><td>

`optional`

</td><td>

[DownloadBehavior](./puppeteer.downloadbehavior.md)

</td><td>

Behavior definition for when downloading a file.

**Remarks:**

If not set, the default behavior will be used.

</td><td>

</td></tr>
<tr><td>

<span id="proxybypasslist">proxyBypassList</span>

</td><td>

`optional`

</td><td>

string\[\]

</td><td>

Bypass the proxy for the given list of hosts.

</td><td>

</td></tr>
<tr><td>

<span id="proxyserver">proxyServer</span>

</td><td>

`optional`

</td><td>

string

</td><td>

Proxy server with optional port to use for all requests. Username and password can be set in `Page.authenticate`.

</td><td>

</td></tr>
</tbody></table>
