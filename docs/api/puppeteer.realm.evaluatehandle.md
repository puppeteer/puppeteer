---
sidebar_label: Realm.evaluateHandle
---

# Realm.evaluateHandle() method

Evaluates a function in the realm's context and returns a [JSHandle](./puppeteer.jshandle.md) to the result.

If the function passed to `realm.evaluateHandle` returns a Promise, the method will wait for the promise to resolve and return its value.

[JSHandle](./puppeteer.jshandle.md) instances can be passed as arguments to the function.

### Signature

```typescript
class Realm {
  abstract evaluateHandle<
    Params extends unknown[],
    Func extends EvaluateFunc<Params> = EvaluateFunc<Params>,
  >(
    pageFunction: Func | string,
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

pageFunction

</td><td>

Func \| string

</td><td>

A function to be evaluated in the realm.

</td></tr>
<tr><td>

args

</td><td>

Params

</td><td>

Arguments to be passed to the `pageFunction`.

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;[HandleFor](./puppeteer.handlefor.md)&lt;Awaited&lt;ReturnType&lt;Func&gt;&gt;&gt;&gt;

A promise that resolves to a [JSHandle](./puppeteer.jshandle.md) containing the result.

## Example

```ts
const aHandle = await realm.evaluateHandle(() => document.body);
const resultHandle = await realm.evaluateHandle(
  body => body.innerHTML,
  aHandle,
);
```
