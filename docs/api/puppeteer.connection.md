---
sidebar_label: Connection
---

# Connection class

### Signature

```typescript
export declare class Connection extends EventEmitter<CDPSessionEvents>
```

**Extends:** [EventEmitter](./puppeteer.eventemitter.md)&lt;[CDPSessionEvents](./puppeteer.cdpsessionevents.md)&gt;

## Remarks

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `Connection` class.

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

<span id="logger">logger</span>

</td><td>

`readonly`

</td><td>

[Logger](./puppeteer.logger.md) \| undefined

</td><td>

</td></tr>
<tr><td>

<span id="timeout">timeout</span>

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

<span id="createsession">[createSession(targetInfo)](./puppeteer.connection.createsession.md)</span>

</td><td>

</td><td>

</td></tr>
<tr><td>

<span id="dispose">[dispose()](./puppeteer.connection.dispose.md)</span>

</td><td>

</td><td>

</td></tr>
<tr><td>

<span id="fromsession">[fromSession(session)](./puppeteer.connection.fromsession.md)</span>

</td><td>

`static`

</td><td>

</td></tr>
<tr><td>

<span id="send">[send(method, params, options)](./puppeteer.connection.send.md)</span>

</td><td>

</td><td>

</td></tr>
<tr><td>

<span id="session">[session(sessionId)](./puppeteer.connection.session.md)</span>

</td><td>

</td><td>

</td></tr>
<tr><td>

<span id="url">[url()](./puppeteer.connection.url.md)</span>

</td><td>

</td><td>

</td></tr>
</tbody></table>
