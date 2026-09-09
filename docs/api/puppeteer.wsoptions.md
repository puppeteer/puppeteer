---
sidebar_label: WsOptions
---

# WsOptions interface

Options for the WebSocket connection to the browser.

### Signature

```typescript
export interface WsOptions
```

## Remarks

Only used in the Node.js environment.

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

<span id="headers">headers</span>

</td><td>

`optional`

</td><td>

Record&lt;string, string&gt;

</td><td>

Headers to use for the web socket connection.

</td><td>

</td></tr>
<tr><td>

<span id="keepalive">keepAlive</span>

</td><td>

`optional`

</td><td>

boolean

</td><td>

Whether to send WebSocket pings and drop the connection when a pong does not come back within the same interval. Detects a connection that died without a close frame, which otherwise leaves calls hanging until `protocolTimeout`.

</td><td>

`false`

</td></tr>
<tr><td>

<span id="keepaliveintervalms">keepAliveIntervalMs</span>

</td><td>

`optional`

</td><td>

number

</td><td>

Ping period in milliseconds. Only used when [WsOptions.keepAlive](./puppeteer.wsoptions.md#keepalive) is set.

</td><td>

`30_000`

</td></tr>
</tbody></table>
