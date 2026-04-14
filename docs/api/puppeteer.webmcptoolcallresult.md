---
sidebar_label: WebMCPToolCallResult
---

# WebMCPToolCallResult interface

### Signature

```typescript
export interface WebMCPToolCallResult
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

<span id="call">call</span>

</td><td>

`optional`

</td><td>

[WebMCPToolCall](./puppeteer.webmcptoolcall.md)

</td><td>

The corresponding tool call if available.

</td><td>

</td></tr>
<tr><td>

<span id="errortext">errorText</span>

</td><td>

`optional`

</td><td>

string

</td><td>

Error text.

</td><td>

</td></tr>
<tr><td>

<span id="exception">exception</span>

</td><td>

`optional`

</td><td>

Protocol.Runtime.RemoteObject

</td><td>

The exception object, if the javascript tool threw an error.

</td><td>

</td></tr>
<tr><td>

<span id="id">id</span>

</td><td>

</td><td>

string

</td><td>

Tool invocation identifier.

</td><td>

</td></tr>
<tr><td>

<span id="output">output</span>

</td><td>

`optional`

</td><td>

any

</td><td>

Output or error delivered as delivered to the agent. Missing if `status` is anything other than Completed.

</td><td>

</td></tr>
<tr><td>

<span id="status">status</span>

</td><td>

</td><td>

[WebMCPInvocationStatus](./puppeteer.webmcpinvocationstatus.md)

</td><td>

Status of the invocation.

</td><td>

</td></tr>
</tbody></table>
