---
sidebar_label: WebWorker.evaluate
---

# WebWorker.evaluate() method

Evaluates a given function in the [worker](./puppeteer.webworker.md).

### Signature

```typescript
class WebWorker {
  evaluate<
    Params extends unknown[],
    Func extends EvaluateFunc<Params> = EvaluateFunc<Params>,
  >(func: Func | string, ...args: Params): Promise<Awaited<ReturnType<Func>>>;
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

Promise&lt;Awaited&lt;ReturnType&lt;Func&gt;&gt;&gt;

The result of `func`.

## Remarks

If the given function returns a promise, [evaluate](./puppeteer.webworker.evaluate.md) will wait for the promise to resolve.

As a rule of thumb, if the return value of the given function is more complicated than a JSON object (e.g. most classes), then [evaluate](./puppeteer.webworker.evaluate.md) will \_likely\_ return some truncated value (or `{}`). This is because we are not returning the actual return value, but a deserialized version as a result of transferring the return value through a protocol to Puppeteer.

In general, you should use [evaluateHandle](./puppeteer.webworker.evaluatehandle.md) if [evaluate](./puppeteer.webworker.evaluate.md) cannot serialize the return value properly or you need a mutable [handle](./puppeteer.jshandle.md) to the return object.
