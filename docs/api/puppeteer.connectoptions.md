---
sidebar_label: ConnectOptions
---

# ConnectOptions interface

#### Signature:

```typescript
export interface ConnectOptions extends BrowserConnectOptions
```

**Extends:** [BrowserConnectOptions](./puppeteer.browserconnectoptions.md)

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

<span id="transport">transport</span>

</td><td>

`optional`

</td><td>

[ConnectionTransport](./puppeteer.connectiontransport.md)

</td><td>

</td><td>

</td></tr>
</tbody></table>
