# Request Interception

Once request interception is enabled, every request will stall unless it's
continued, responded or aborted.

An example of a naïve request interceptor that aborts all image requests:

```ts
import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setRequestInterception(true);
  page.on('request', interceptedRequest => {
    if (interceptedRequest.isInterceptResolutionHandled()) return;
    if (
      interceptedRequest.url().endsWith('.png') ||
      interceptedRequest.url().endsWith('.jpg')
    )
      interceptedRequest.abort();
    else interceptedRequest.continue();
  });
  await page.goto('https://example.com');
  await browser.close();
})();
```

## Multiple Intercept Handlers and Asynchronous Resolutions

By default Puppeteer will raise a `Request is already handled!` exception if
`request.abort`, `request.continue`, or `request.respond` are called after any
of them have already been called.

Always assume that an unknown handler may have already called
`abort/continue/respond`. Even if your handler is the only one you registered,
3rd party packages may register their own handlers. It is therefore important to
always check the resolution status using
[request.isInterceptResolutionHandled](../api/puppeteer.httprequest.isinterceptresolutionhandled)
before calling `abort/continue/respond`.

Importantly, the intercept resolution may get handled by another listener while
your handler is awaiting an asynchronous operation. Therefore, the return value
of `request.isInterceptResolutionHandled` is only safe in a synchronous code
block. Always execute `request.isInterceptResolutionHandled` and
`abort/continue/respond` **synchronously** together.

This example demonstrates two synchronous handlers working together:

```ts
/*
This first handler will succeed in calling request.continue because the request interception has never been resolved.
*/
page.on('request', interceptedRequest => {
  if (interceptedRequest.isInterceptResolutionHandled()) return;
  interceptedRequest.continue();
});

/*
This second handler will return before calling request.abort because request.continue was already
called by the first handler.
*/
page.on('request', interceptedRequest => {
  if (interceptedRequest.isInterceptResolutionHandled()) return;
  interceptedRequest.abort();
});
```

This example demonstrates asynchronous handlers working together:

```ts
/*
This first handler will succeed in calling request.continue because the request interception has never been resolved.
*/
page.on('request', interceptedRequest => {
  // The interception has not been handled yet. Control will pass through this guard.
  if (interceptedRequest.isInterceptResolutionHandled()) return;

  // It is not strictly necessary to return a promise, but doing so will allow Puppeteer to await this handler.
  return new Promise(resolve => {
    // Continue after 500ms
    setTimeout(() => {
      // Inside, check synchronously to verify that the intercept wasn't handled already.
      // It might have been handled during the 500ms while the other handler awaited an async op of its own.
      if (interceptedRequest.isInterceptResolutionHandled()) {
        resolve();
        return;
      }
      interceptedRequest.continue();
      resolve();
    }, 500);
  });
});
page.on('request', async interceptedRequest => {
  // The interception has not been handled yet. Control will pass through this guard.
  if (interceptedRequest.isInterceptResolutionHandled()) return;

  await someLongAsyncOperation();
  // The interception *MIGHT* have been handled by the first handler, we can't be sure.
  // Therefore, we must check again before calling continue() or we risk Puppeteer raising an exception.
  if (interceptedRequest.isInterceptResolutionHandled()) return;
  interceptedRequest.continue();
});
```

For finer-grained introspection (see Cooperative Intercept Mode below), you may
also call
[request.interceptResolutionState](../api/puppeteer.httprequest.interceptresolutionstate)
synchronously before using `abort/continue/respond`.

Here is the example above rewritten using `request.interceptResolutionState`

```ts
/*
This first handler will succeed in calling request.continue because the request interception has never been resolved.
*/
page.on('request', interceptedRequest => {
  // The interception has not been handled yet. Control will pass through this guard.
  const {action} = interceptedRequest.interceptResolutionState();
  if (action === InterceptResolutionAction.AlreadyHandled) return;

  // It is not strictly necessary to return a promise, but doing so will allow Puppeteer to await this handler.
  return new Promise(resolve => {
    // Continue after 500ms
    setTimeout(() => {
      // Inside, check synchronously to verify that the intercept wasn't handled already.
      // It might have been handled during the 500ms while the other handler awaited an async op of its own.
      const {action} = interceptedRequest.interceptResolutionState();
      if (action === InterceptResolutionAction.AlreadyHandled) {
        resolve();
        return;
      }
      interceptedRequest.continue();
      resolve();
    }, 500);
  });
});
page.on('request', async interceptedRequest => {
  // The interception has not been handled yet. Control will pass through this guard.
  if (
    interceptedRequest.interceptResolutionState().action ===
    InterceptResolutionAction.AlreadyHandled
  )
    return;

  await someLongAsyncOperation();
  // The interception *MIGHT* have been handled by the first handler, we can't be sure.
  // Therefore, we must check again before calling continue() or we risk Puppeteer raising an exception.
  if (
    interceptedRequest.interceptResolutionState().action ===
    InterceptResolutionAction.AlreadyHandled
  )
    return;
  interceptedRequest.continue();
});
```

## Cooperative Intercept Mode

`request.abort`, `request.continue`, and `request.respond` can accept an
optional `priority` to work in Cooperative Intercept Mode. When all handlers are
using Cooperative Intercept Mode, Puppeteer guarantees that all intercept
handlers will run and be awaited in order of registration. The interception is
resolved to the highest-priority resolution. Here are the rules of Cooperative
Intercept Mode:

- All resolutions must supply a numeric `priority` argument to
  `abort/continue/respond`.
- If any resolution does not supply a numeric `priority`, Legacy Mode is active
  and Cooperative Intercept Mode is inactive.
- Async handlers finish before intercept resolution is finalized.
- The highest priority interception resolution "wins", i.e. the interception is
  ultimately aborted/responded/continued according to which resolution was given
  the highest priority.
- In the event of a tie, `abort` > `respond` > `continue`.

For standardization, when specifying a Cooperative Intercept Mode priority use
`0` or `DEFAULT_INTERCEPT_RESOLUTION_PRIORITY` (exported from `HTTPRequest`)
unless you have a clear reason to use a higher priority. This gracefully prefers
`respond` over `continue` and `abort` over `respond` and allows other handlers
to work cooperatively. If you do intentionally want to use a different priority,
higher priorities win over lower priorities. Negative priorities are allowed.
For example, `continue({}, 4)` would win over `continue({}, -2)`.

To preserve backward compatibility, any handler resolving the intercept without
specifying `priority` (Legacy Mode) causes immediate resolution. For Cooperative
Intercept Mode to work, all resolutions must use a `priority`. In practice, this
means you must still test for `request.isInterceptResolutionHandled` because a
handler beyond your control may have called `abort/continue/respond` without a
priority (Legacy Mode).

In this example, Legacy Mode prevails and the request is aborted immediately
because at least one handler omits `priority` when resolving the intercept:

```ts
// Final outcome: immediate abort()
page.setRequestInterception(true);
page.on('request', request => {
  if (request.isInterceptResolutionHandled()) return;

  // Legacy Mode: interception is aborted immediately.
  request.abort('failed');
});
page.on('request', request => {
  if (request.isInterceptResolutionHandled()) return;
  // Control will never reach this point because the request was already aborted in Legacy Mode

  // Cooperative Intercept Mode: votes for continue at priority 0.
  request.continue({}, 0);
});
```

In this example, Legacy Mode prevails and the request is continued because at
least one handler does not specify a `priority`:

```ts
// Final outcome: immediate continue()
page.setRequestInterception(true);
page.on('request', request => {
  if (request.isInterceptResolutionHandled()) return;

  // Cooperative Intercept Mode: votes to abort at priority 0.
  request.abort('failed', 0);
});
page.on('request', request => {
  if (request.isInterceptResolutionHandled()) return;

  // Control reaches this point because the request was cooperatively aborted which postpones resolution.

  // { action: InterceptResolutionAction.Abort, priority: 0 }, because abort @ 0 is the current winning resolution
  console.log(request.interceptResolutionState());

  // Legacy Mode: intercept continues immediately.
  request.continue({});
});
page.on('request', request => {
  // { action: InterceptResolutionAction.AlreadyHandled }, because continue in Legacy Mode was called
  console.log(request.interceptResolutionState());
});
```

In this example, Cooperative Intercept Mode is active because all handlers
specify a `priority`. `continue()` wins because it has a higher priority than
`abort()`.

```ts
// Final outcome: cooperative continue() @ 5
page.setRequestInterception(true);
page.on('request', request => {
  if (request.isInterceptResolutionHandled()) return;

  // Cooperative Intercept Mode: votes to abort at priority 10
  request.abort('failed', 0);
});
page.on('request', request => {
  if (request.isInterceptResolutionHandled()) return;

  // Cooperative Intercept Mode: votes to continue at priority 5
  request.continue(request.continueRequestOverrides(), 5);
});
page.on('request', request => {
  // { action: InterceptResolutionAction.Continue, priority: 5 }, because continue @ 5 > abort @ 0
  console.log(request.interceptResolutionState());
});
```

In this example, Cooperative Intercept Mode is active because all handlers
specify `priority`. `respond()` wins because its priority ties with
`continue()`, but `respond()` beats `continue()`.

```ts
// Final outcome: cooperative respond() @ 15
page.setRequestInterception(true);
page.on('request', request => {
  if (request.isInterceptResolutionHandled()) return;

  // Cooperative Intercept Mode: votes to abort at priority 10
  request.abort('failed', 10);
});
page.on('request', request => {
  if (request.isInterceptResolutionHandled()) return;

  // Cooperative Intercept Mode: votes to continue at priority 15
  request.continue(request.continueRequestOverrides(), 15);
});
page.on('request', request => {
  if (request.isInterceptResolutionHandled()) return;

  // Cooperative Intercept Mode: votes to respond at priority 15
  request.respond(request.responseForRequest(), 15);
});
page.on('request', request => {
  if (request.isInterceptResolutionHandled()) return;

  // Cooperative Intercept Mode: votes to respond at priority 12
  request.respond(request.responseForRequest(), 12);
});
page.on('request', request => {
  // { action: InterceptResolutionAction.Respond, priority: 15 }, because respond @ 15 > continue @ 15 > respond @ 12 > abort @ 10
  console.log(request.interceptResolutionState());
});
```

## Cooperative Request Continuation

Puppeteer requires `request.continue()` to be called explicitly or the request
will hang. Even if your handler means to take no special action, or 'opt out',
`request.continue()` must still be called.

With the introduction of Cooperative Intercept Mode, two use cases arise for
cooperative request continuations: Unopinionated and Opinionated.

The first case (common) is that your handler means to opt out of doing anything
special the request. It has no opinion on further action and simply intends to
continue by default and/or defer to other handlers that might have an opinion.
But in case there are no other handlers, we must call `request.continue()` to
ensure that the request doesn't hang.

We call this an **Unopinionated continuation** because the intent is to continue
the request if nobody else has a better idea. Use
`request.continue({...}, DEFAULT_INTERCEPT_RESOLUTION_PRIORITY)` (or `0`) for
this type of continuation.

The second case (uncommon) is that your handler actually does have an opinion
and means to force continuation by overriding a lower-priority `abort()` or
`respond()` issued elsewhere. We call this an **Opinionated continuation**. In
these rare cases where you mean to specify an overriding continuation priority,
use a custom priority.

To summarize, reason through whether your use of `request.continue` is just
meant to be default/bypass behavior vs falling within the intended use case of
your handler. Consider using a custom priority for in-scope use cases, and a
default priority otherwise. Be aware that your handler may have both Opinionated
and Unopinionated cases.

## Upgrading to Cooperative Intercept Mode for package maintainers

If you are package maintainer and your package uses intercept handlers, you can
update your intercept handlers to use Cooperative Intercept Mode. Suppose you
have the following existing handler:

```ts
page.on('request', interceptedRequest => {
  if (request.isInterceptResolutionHandled()) return;
  if (
    interceptedRequest.url().endsWith('.png') ||
    interceptedRequest.url().endsWith('.jpg')
  )
    interceptedRequest.abort();
  else interceptedRequest.continue();
});
```

To use Cooperative Intercept Mode, upgrade `continue()` and `abort()`:

```ts
page.on('request', interceptedRequest => {
  if (request.isInterceptResolutionHandled()) return;
  if (
    interceptedRequest.url().endsWith('.png') ||
    interceptedRequest.url().endsWith('.jpg')
  )
    interceptedRequest.abort('failed', 0);
  else
    interceptedRequest.continue(
      interceptedRequest.continueRequestOverrides(),
      0,
    );
});
```

With those simple upgrades, your handler now uses Cooperative Intercept Mode
instead.

However, we recommend a slightly more robust solution because the above
introduces several subtle issues:

1. **Backward compatibility.** If any handler still uses a Legacy Mode
   resolution (ie, does not specify a priority), that handler will resolve the
   interception immediately even if your handler runs first. This could cause
   disconcerting behavior for your users because suddenly your handler is not
   resolving the interception and a different handler is taking priority when
   all the user did was upgrade your package.
2. **Hard-coded priority.** Your package user has no ability to specify the
   default resolution priority for your handlers. This can become important when
   the user wishes to manipulate the priorities based on use case. For example,
   one user might want your package to take a high priority while another user
   might want it to take a low priority.

To resolve both of these issues, our recommended approach is to export a
`setInterceptResolutionConfig()` from your package. The user can then call
`setInterceptResolutionConfig()` to explicitly activate Cooperative Intercept
Mode in your package so they aren't surprised by changes in how the interception
is resolved. They can also optionally specify a custom priority using
`setInterceptResolutionConfig(priority)` that works for their use case:

```ts
// Defaults to undefined which preserves Legacy Mode behavior
let _priority = undefined;

// Export a module configuration function
export const setInterceptResolutionConfig = (priority = 0) =>
  (_priority = priority);

/**
 * Note that this handler uses `DEFAULT_INTERCEPT_RESOLUTION_PRIORITY` to "pass" on this request. It is important to use
 * the default priority when your handler has no opinion on the request and the intent is to continue() by default.
 */
page.on('request', interceptedRequest => {
  if (request.isInterceptResolutionHandled()) return;
  if (
    interceptedRequest.url().endsWith('.png') ||
    interceptedRequest.url().endsWith('.jpg')
  )
    interceptedRequest.abort('failed', _priority);
  else
    interceptedRequest.continue(
      interceptedRequest.continueRequestOverrides(),
      DEFAULT_INTERCEPT_RESOLUTION_PRIORITY, // Unopinionated continuation
    );
});
```

If your package calls for more fine-grained control over resolution priorities,
use a config pattern like this:

```ts
interface InterceptResolutionConfig {
  abortPriority?: number;
  continuePriority?: number;
}

// This approach supports multiple priorities based on situational
// differences. You could, for example, create a config that
// allowed separate priorities for PNG vs JPG.
const DEFAULT_CONFIG: InterceptResolutionConfig = {
  abortPriority: undefined, // Default to Legacy Mode
  continuePriority: undefined, // Default to Legacy Mode
};

// Defaults to undefined which preserves Legacy Mode behavior
let _config: Partial<InterceptResolutionConfig> = {};

export const setInterceptResolutionConfig = (
  config: InterceptResolutionConfig,
) => (_config = {...DEFAULT_CONFIG, ...config});

page.on('request', interceptedRequest => {
  if (request.isInterceptResolutionHandled()) return;
  if (
    interceptedRequest.url().endsWith('.png') ||
    interceptedRequest.url().endsWith('.jpg')
  ) {
    interceptedRequest.abort('failed', _config.abortPriority);
  } else {
    // Here we use a custom-configured priority to allow for Opinionated
    // continuation.
    // We would only want to allow this if we had a very clear reason why
    // some use cases required Opinionated continuation.
    interceptedRequest.continue(
      interceptedRequest.continueRequestOverrides(),
      _config.continuePriority, // Why would we ever want priority!==0 here?
    );
  }
});
```

The above solutions ensure backward compatibility while also allowing the user
to adjust the importance of your package in the resolution chain when
Cooperative Intercept Mode is being used. Your package continues to work as
expected until the user has fully upgraded their code and all third party
packages to use Cooperative Intercept Mode. If any handler or package still uses
Legacy Mode, your package can still operate in Legacy Mode too.
