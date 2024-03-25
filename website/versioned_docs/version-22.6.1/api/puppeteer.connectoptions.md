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

browserURL

</td><td>

`optional`

</td><td>

string

</td><td>

</td><td>

</td></tr>
<tr><td>

browserWSEndpoint

</td><td>

`optional`

</td><td>

string

</td><td>

</td><td>

</td></tr>
<tr><td>

headers

</td><td>

`optional`

</td><td>

Record&lt;string, string&gt;

</td><td>

Headers to use for the web socket connection.

</td><td>

</td></tr>
<tr><td>

transport

</td><td>

`optional`

</td><td>

[ConnectionTransport](./puppeteer.connectiontransport.md)

</td><td>

</td><td>

</td></tr>
</tbody></table>
