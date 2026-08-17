---
sidebar_label: Realm.evaluate
---

# Realm.evaluate() method

Evaluates a function in the realm's context and returns the resulting value.

If the function passed to `realm.evaluate` returns a Promise, the method will wait for the promise to resolve and return its value.

[JSHandle](./puppeteer.jshandle.md) instances can be passed as arguments to the function.

### Signature

```typescript
class Realm {
  abstract evaluate<
    Params extends unknown[],
    Func extends EvaluateFunc<Params> = EvaluateFunc<Params>,
  >(
    pageFunction: Func | string,
    ...args: Params
  ): Promise<Awaited<ReturnType<Func>>>;
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

Promise&lt;Awaited&lt;ReturnType&lt;Func&gt;&gt;&gt;

A promise that resolves to the return value of the function.

## Example

```ts
const result = await realm.evaluate(() => {
  return Promise.resolve(8 * 7);
});
console.log(result); // prints "56"
```
