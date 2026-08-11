---
sidebar_label: ExtensionTransport
---

# ExtensionTransport class

Experimental ExtensionTransport allows establishing a connection via chrome.debugger API if Puppeteer runs in an extension. Since Chrome DevTools Protocol is restricted for extensions, the transport implements missing commands and events.

### Signature

```typescript
export declare class ExtensionTransport implements ConnectionTransport
```

**Implements:** [ConnectionTransport](./puppeteer.connectiontransport.md)

## Remarks

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `ExtensionTransport` class.

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

<span id="onclose">onclose</span>

</td><td>

`optional`

</td><td>

() =&gt; void

</td><td>

</td></tr>
<tr><td>

<span id="onmessage">onmessage</span>

</td><td>

`optional`

</td><td>

(message: string) =&gt; void

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

<span id="close">[close()](./puppeteer.extensiontransport.close.md)</span>

</td><td>

</td><td>

</td></tr>
<tr><td>

<span id="connecttab">[connectTab(tabId)](./puppeteer.extensiontransport.connecttab.md)</span>

</td><td>

`static`

</td><td>

</td></tr>
<tr><td>

<span id="send">[send(message)](./puppeteer.extensiontransport.send.md)</span>

</td><td>

</td><td>

</td></tr>
</tbody></table>
