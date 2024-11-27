---
sidebar_label: ConnectOptions
---

# ConnectOptions interface

Generic browser options that can be passed when launching any browser or when connecting to an existing browser instance.

### Signature

```typescript
export interface ConnectOptions
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

<span id="acceptinsecurecerts">acceptInsecureCerts</span>

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

<span id="browserurl">browserURL</span>

</td><td>

`optional`

</td><td>

string

</td><td>

</td><td>

</td></tr>
<tr><td>

<span id="browserwsendpoint">browserWSEndpoint</span>

</td><td>

`optional`

</td><td>

string

</td><td>

</td><td>

</td></tr>
<tr><td>

<span id="capabilities">capabilities</span>

</td><td>

`optional`

</td><td>

[SupportedWebDriverCapabilities](./puppeteer.supportedwebdrivercapabilities.md)

</td><td>

WebDriver BiDi capabilities passed to BiDi `session.new`.

**Remarks:**

Only works for `protocol="webDriverBiDi"` and [Puppeteer.connect()](./puppeteer.puppeteer.connect.md).

</td><td>

</td></tr>
<tr><td>

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

<span id="downloadbehavior">downloadBehavior</span>

</td><td>

`optional`

</td><td>

[DownloadBehavior](./puppeteer.downloadbehavior.md)

</td><td>

Sets the download behavior for the context.

</td><td>

</td></tr>
<tr><td>

<span id="headers">headers</span>

</td><td>

`optional`

</td><td>

Record&lt;string, string&gt;

</td><td>

Headers to use for the web socket connection.

**Remarks:**

Only works in the Node.js environment.

</td><td>

</td></tr>
<tr><td>

<span id="protocol">protocol</span>

</td><td>

`optional`

</td><td>

[ProtocolType](./puppeteer.protocoltype.md)

</td><td>

</td><td>

Determined at run time:

- Launching Chrome - 'cdp'.

- Launching Firefox - 'webDriverBiDi'.

- Connecting to a browser - 'cdp'.

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
<tr><td>

<span id="transport">transport</span>

</td><td>

`optional`

</td><td>

[ConnectionTransport](./puppeteer.connectiontransport.md)

</td><td>

</td><td>

</td></tr>
</tbody></table>
