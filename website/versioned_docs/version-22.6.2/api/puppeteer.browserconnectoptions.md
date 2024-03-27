---
sidebar_label: BrowserConnectOptions
---

# BrowserConnectOptions interface

Generic browser options that can be passed when launching any browser or when connecting to an existing browser instance.

#### Signature:

```typescript
export interface BrowserConnectOptions
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

defaultViewport

</td><td>

`optional`

</td><td>

[Viewport](./puppeteer.viewport.md) \| null

</td><td>

Sets the viewport for each page.

</td><td>

'&#123;width: 800, height: 600&#125;'

</td></tr>
<tr><td>

ignoreHTTPSErrors

</td><td>

`optional`

</td><td>

boolean

</td><td>

Whether to ignore HTTPS errors during navigation.

</td><td>

`false`

</td></tr>
<tr><td>

protocol

</td><td>

`optional`

</td><td>

[ProtocolType](./puppeteer.protocoltype.md)

</td><td>

</td><td>

'cdp'

</td></tr>
<tr><td>

protocolTimeout

</td><td>

`optional`

</td><td>

number

</td><td>

Timeout setting for individual protocol (CDP) calls.

</td><td>

`180_000`

</td></tr>
<tr><td>

slowMo

</td><td>

`optional`

</td><td>

number

</td><td>

Slows down Puppeteer operations by the specified amount of milliseconds to aid debugging.

</td><td>

</td></tr>
<tr><td>

targetFilter

</td><td>

`optional`

</td><td>

[TargetFilterCallback](./puppeteer.targetfiltercallback.md)

</td><td>

Callback to decide if Puppeteer should connect to a given target or not.

</td><td>

</td></tr>
</tbody></table>
