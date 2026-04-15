---
sidebar_label: Realm.waitForFunction
---

# Realm.waitForFunction() method

Waits for a function to return a truthy value when evaluated in the realm's context.

Arguments can be passed from Node.js to `pageFunction`.

### Signature

```typescript
class Realm {
  waitForFunction<
    Params extends unknown[],
    Func extends EvaluateFunc<Params> = EvaluateFunc<Params>,
  >(
    pageFunction: Func | string,
    options?: {
      polling?: 'raf' | 'mutation' | number;
      timeout?: number;
      root?: ElementHandle<Node>;
      signal?: AbortSignal;
    },
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

A function to evaluate in the realm.

</td></tr>
<tr><td>

options

</td><td>

&#123; polling?: 'raf' \| 'mutation' \| number; timeout?: number; root?: [ElementHandle](./puppeteer.elementhandle.md)&lt;Node&gt;; signal?: AbortSignal; &#125;

</td><td>

_(Optional)_ Options for polling and timeouts.

</td></tr>
<tr><td>

args

</td><td>

Params

</td><td>

Arguments to pass to the function.

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;[HandleFor](./puppeteer.handlefor.md)&lt;Awaited&lt;ReturnType&lt;Func&gt;&gt;&gt;&gt;

A promise that resolves when the function returns a truthy value.

## Example

```ts
const selector = '.foo';
await realm.waitForFunction(
  selector => !!document.querySelector(selector),
  {},
  selector,
);
```
