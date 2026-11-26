---
sidebar_label: RemoteException
---

# RemoteException class

A protocol-agnostic description of an uncaught exception thrown in a page or worker. Dispatched via the `exception` event on [Page](./puppeteer.page.md) and [WebWorker](./puppeteer.webworker.md).

### Signature

```typescript
export declare class RemoteException
```

## Remarks

Unlike the deprecated `pageerror` event, `RemoteException` does not reconstruct a Node.js `Error`. When the protocol supports it (CDP), it exposes the live remote exception value through [RemoteException.handle()](./puppeteer.remoteexception.handle.md).

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `RemoteException` class.

## Example

```ts
page.on('exception', exception => {
  console.log(exception.name(), exception.text());
  console.log(exception.location());
});
```

## Methods

<table><thead><tr><th>

Method

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

<span id="handle">[handle()](./puppeteer.remoteexception.handle.md)</span>

</td><td>

</td><td>

The live remote exception value, if available.

**Remarks:**

Only available with CDP, when the browser reports a reference to the thrown value (objects and symbols) and Puppeteer can bind it to the worker, the main world of a frame or Puppeteer's own isolated world.

It is `undefined`:

- for thrown primitives other than symbols;

- for exceptions thrown in other isolated worlds, for example ones created by extensions or via CDP;

- for exceptions thrown by code that Puppeteer injected, for example from a callback scheduled inside [Page.evaluate()](./puppeteer.page.evaluate.md), because the browser does not report a remote exception object for them;

- always with WebDriver BiDi.

The handle is **disposed automatically right after the `exception` event has been dispatched** so that the browser can release the exception. To keep using it beyond the synchronous part of your listener, call [JSHandle.move](./puppeteer.jshandle.md#move) synchronously inside the listener and dispose of the handle yourself once you are done with it:

```ts
page.on('exception', async exception => {
  // Must be called before the first `await`.
  const handle = exception.handle()?.move();
  if (!handle) {
    return;
  }
  try {
    const code = await handle.evaluate(error => {
      return (error as {code?: string}).code;
    });
    console.log(code);
  } finally {
    await handle.dispose();
  }
});
```

Using the handle after an `await` without calling `move()` first will throw because the handle has already been disposed.

The handle is shared by all listeners of the event: calling `move()` returns the same `JSHandle` instance in every listener, and disposing it invalidates it for all of them. If more than one listener needs the handle after the event, have only one of them call `move()` and dispose of it.

</td></tr>
<tr><td>

<span id="location">[location()](./puppeteer.remoteexception.location.md)</span>

</td><td>

</td><td>

The primary location where the exception occurred.

**Remarks:**

For runtime errors this is `stackTrace()[0]`. For compilation and syntax errors (where `stackTrace()` is empty), it falls back to the top-level coordinates reported for the exception.

</td></tr>
<tr><td>

<span id="name">[name()](./puppeteer.remoteexception.name.md)</span>

</td><td>

</td><td>

The name of the exception, for example `Error`, `TypeError`, `SyntaxError` or `AbortError`.

**Remarks:**

This is the `name` of the thrown error as rendered by the browser, which can differ from its constructor (for example `AbortError` for a `DOMException`).

Empty string if the thrown value is not an error, for example a primitive, a plain object or a symbol.

Always `null` with WebDriver BiDi, which does not report the name of the exception.

</td></tr>
<tr><td>

<span id="stacktrace">[stackTrace()](./puppeteer.remoteexception.stacktrace.md)</span>

</td><td>

</td><td>

The call frames on the stack at the time the exception was thrown, innermost first.

**Remarks:**

Empty for compilation and syntax errors.

</td></tr>
<tr><td>

<span id="text">[text()](./puppeteer.remoteexception.text.md)</span>

</td><td>

</td><td>

The text of the exception as rendered by the browser, for example `Error: boom` or `TypeError: Cannot read properties of undefined (reading 'foo')`.

**Remarks:**

For errors this is `${name}: ${message}` (or just the name if the message is empty), without the stack. For other thrown values it is their description, for example `Object` for a plain object or the string itself for a thrown string.

</td></tr>
</tbody></table>
