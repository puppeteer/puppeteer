---
sidebar_label: CDPSession
---

# CDPSession class

The `CDPSession` instances are used to talk raw Chrome Devtools Protocol.

#### Signature:

```typescript
export declare class CDPSession extends EventEmitter
```

**Extends:** [EventEmitter](./puppeteer.eventemitter.md)

## Remarks

Protocol methods can be called with [CDPSession.send()](./puppeteer.cdpsession.send.md) method and protocol events can be subscribed to with `CDPSession.on` method.

Useful links: [DevTools Protocol Viewer](https://chromedevtools.github.io/devtools-protocol/) and [Getting Started with DevTools Protocol](https://github.com/aslushnikov/getting-started-with-cdp/blob/HEAD/README.md).

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `CDPSession` class.

## Example

```ts
const client = await page.target().createCDPSession();
await client.send('Animation.enable');
client.on('Animation.animationCreated', () =>
  console.log('Animation created!')
);
const response = await client.send('Animation.getPlaybackRate');
console.log('playback rate is ' + response.playbackRate);
await client.send('Animation.setPlaybackRate', {
  playbackRate: response.playbackRate / 2,
});
```

## Methods

| Method                                                    | Modifiers | Description                                                                                                                             |
| --------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| [connection()](./puppeteer.cdpsession.connection.md)      |           |                                                                                                                                         |
| [detach()](./puppeteer.cdpsession.detach.md)              |           | Detaches the cdpSession from the target. Once detached, the cdpSession object won't emit any events and can't be used to send messages. |
| [id()](./puppeteer.cdpsession.id.md)                      |           | Returns the session's id.                                                                                                               |
| [send(method, paramArgs)](./puppeteer.cdpsession.send.md) |           |                                                                                                                                         |
