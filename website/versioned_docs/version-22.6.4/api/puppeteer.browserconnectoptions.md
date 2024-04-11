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

<span id="defaultviewport">defaultViewport</span>

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

<span id="ignorehttpserrors">ignoreHTTPSErrors</span>

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

<span id="protocol">protocol</span>

</td><td>

`optional`

</td><td>

[ProtocolType](./puppeteer.protocoltype.md)

</td><td>

</td><td>

'cdp'

</td></tr>
<tr><td>

<span id="protocoltimeout">protocolTimeout</span>

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

<span id="slowmo">slowMo</span>

</td><td>

`optional`

</td><td>

number

</td><td>

Slows down Puppeteer operations by the specified amount of milliseconds to aid debugging.

</td><td>

</td></tr>
<tr><td>

<span id="targetfilter">targetFilter</span>

</td><td>

`optional`

</td><td>

[TargetFilterCallback](./puppeteer.targetfiltercallback.md)

</td><td>

Callback to decide if Puppeteer should connect to a given target or not.

</td><td>

</td></tr>
</tbody></table>
