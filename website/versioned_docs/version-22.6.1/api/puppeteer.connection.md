---
sidebar_label: Connection
---

# Connection class

#### Signature:

```typescript
export declare class Connection extends EventEmitter<CDPSessionEvents>
```

**Extends:** [EventEmitter](./puppeteer.eventemitter.md)&lt;[CDPSessionEvents](./puppeteer.cdpsessionevents.md)&gt;

## Constructors

<table><thead><tr><th>

Constructor

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

[(constructor)(url, transport, delay, timeout)](./puppeteer.connection._constructor_.md)

</td><td>

</td><td>

Constructs a new instance of the `Connection` class

</td></tr>
</tbody></table>

## Properties

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

timeout

</td><td>

`readonly`

</td><td>

number

</td><td>

</td></tr>
</tbody></table>

## Methods

<table><thead><tr><th>

Method

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

[createSession(targetInfo)](./puppeteer.connection.createsession.md)

</td><td>

</td><td>

</td></tr>
<tr><td>

[dispose()](./puppeteer.connection.dispose.md)

</td><td>

</td><td>

</td></tr>
<tr><td>

[fromSession(session)](./puppeteer.connection.fromsession.md)

</td><td>

`static`

</td><td>

</td></tr>
<tr><td>

[send(method, params, options)](./puppeteer.connection.send.md)

</td><td>

</td><td>

</td></tr>
<tr><td>

[session(sessionId)](./puppeteer.connection.session.md)

</td><td>

</td><td>

</td></tr>
<tr><td>

[url()](./puppeteer.connection.url.md)

</td><td>

</td><td>

</td></tr>
</tbody></table>
