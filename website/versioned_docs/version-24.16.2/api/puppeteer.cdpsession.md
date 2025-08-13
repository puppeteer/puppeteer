---
sidebar_label: CDPSession
---

# CDPSession class

The `CDPSession` instances are used to talk raw Chrome Devtools Protocol.

### Signature

```typescript
export declare abstract class CDPSession extends EventEmitter<CDPSessionEvents>
```

**Extends:** [EventEmitter](./puppeteer.eventemitter.md)&lt;[CDPSessionEvents](./puppeteer.cdpsessionevents.md)&gt;

## Remarks

Protocol methods can be called with [CDPSession.send()](./puppeteer.cdpsession.send.md) method and protocol events can be subscribed to with `CDPSession.on` method.

Useful links: [DevTools Protocol Viewer](https://chromedevtools.github.io/devtools-protocol/) and [Getting Started with DevTools Protocol](https://github.com/aslushnikov/getting-started-with-cdp/blob/HEAD/README.md).

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `CDPSession` class.

## Example

```ts
const client = await page.createCDPSession();
await client.send('Animation.enable');
client.on('Animation.animationCreated', () =>
  console.log('Animation created!'),
);
const response = await client.send('Animation.getPlaybackRate');
console.log('playback rate is ' + response.playbackRate);
await client.send('Animation.setPlaybackRate', {
  playbackRate: response.playbackRate / 2,
});
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

</th></tr></thead>
<tbody><tr><td>

<span id="detached">detached</span>

</td><td>

`readonly`

</td><td>

boolean

</td><td>

True if the session has been detached, false otherwise.

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

<span id="connection">[connection()](./puppeteer.cdpsession.connection.md)</span>

</td><td>

</td><td>

The underlying connection for this session, if any.

</td></tr>
<tr><td>

<span id="detach">[detach()](./puppeteer.cdpsession.detach.md)</span>

</td><td>

</td><td>

Detaches the cdpSession from the target. Once detached, the cdpSession object won't emit any events and can't be used to send messages.

</td></tr>
<tr><td>

<span id="id">[id()](./puppeteer.cdpsession.id.md)</span>

</td><td>

</td><td>

Returns the session's id.

</td></tr>
<tr><td>

<span id="send">[send(method, params, options)](./puppeteer.cdpsession.send.md)</span>

</td><td>

</td><td>

</td></tr>
</tbody></table>
