---
sidebar_label: ElementHandle.$$eval
---

# ElementHandle.$$eval() method

This method runs `document.querySelectorAll` within the element and passes it as the first argument to `pageFunction`. If there's no element matching `selector`, the method throws an error.

If `pageFunction` returns a Promise, then `frame.$$eval` would wait for the promise to resolve and return its value.

**Signature:**

```typescript
class ElementHandle {
  $$eval<
    Selector extends string,
    Params extends unknown[],
    Func extends EvaluateFunc<
      [Array<NodeFor<Selector>>, ...Params]
    > = EvaluateFunc<[Array<NodeFor<Selector>>, ...Params]>
  >(
    selector: Selector,
    pageFunction: Func | string,
    ...args: Params
  ): Promise<Awaited<ReturnType<Func>>>;
}
```

## Parameters

| Parameter    | Type           | Description |
| ------------ | -------------- | ----------- |
| selector     | Selector       |             |
| pageFunction | Func \| string |             |
| args         | Params         |             |

**Returns:**

Promise&lt;Awaited&lt;ReturnType&lt;Func&gt;&gt;&gt;

## Example 1

```html
<div class="feed">
  <div class="tweet">Hello!</div>
  <div class="tweet">Hi!</div>
</div>
```

## Example 2

```ts
const feedHandle = await page.$('.feed');
expect(
  await feedHandle.$$eval('.tweet', nodes => nodes.map(n => n.innerText))
).toEqual(['Hello!', 'Hi!']);
```
