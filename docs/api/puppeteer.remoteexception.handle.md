---
sidebar_label: RemoteException.handle
---

# RemoteException.handle() method

The live remote exception value, if available.

### Signature

```typescript
class RemoteException {
  handle(): JSHandle | undefined;
}
```

**Returns:**

[JSHandle](./puppeteer.jshandle.md) \| undefined

## Remarks

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
