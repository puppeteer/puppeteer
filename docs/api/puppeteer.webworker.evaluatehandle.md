---
sidebar_label: WebWorker.evaluateHandle
---

# WebWorker.evaluateHandle() method

Evaluates a given function in the [worker](./puppeteer.webworker.md).

### Signature

```typescript
class WebWorker {
  evaluateHandle<
    Params extends unknown[],
    Func extends EvaluateFunc<Params> = EvaluateFunc<Params>,
  >(
    func: Func | string,
    ...args: Params
  ): Promise<HandleFor<Awaited<ReturnType<Func>>>>;
}
```

## Parameters

<table><thead><tr><th>

Parameter

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

func

</td><td>

Func \| string

</td><td>

Function to be evaluated.

</td></tr>
<tr><td>

args

</td><td>

Params

</td><td>

Arguments to pass into `func`.

</td></tr>
</tbody></table>
**Returns:**

Promise&lt;[HandleFor](./puppeteer.handlefor.md)&lt;Awaited&lt;ReturnType&lt;Func&gt;&gt;&gt;&gt;

A [handle](./puppeteer.jshandle.md) to the return value of `func`.

## Remarks

If the given function returns a promise, [evaluate](./puppeteer.webworker.evaluate.md) will wait for the promise to resolve.

In general, you should use [evaluateHandle](./puppeteer.webworker.evaluatehandle.md) if [evaluate](./puppeteer.webworker.evaluate.md) cannot serialize the return value properly or you need a mutable [handle](./puppeteer.jshandle.md) to the return object.
