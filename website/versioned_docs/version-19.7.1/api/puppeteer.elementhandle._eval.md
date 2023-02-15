---
sidebar_label: ElementHandle.$eval
---

# ElementHandle.$eval() method

Runs the given function on the first element matching the given selector in the current element.

If the given function returns a promise, then this method will wait till the promise resolves.

#### Signature:

```typescript
class ElementHandle {
  $eval<
    Selector extends string,
    Params extends unknown[],
    Func extends EvaluateFuncWith<NodeFor<Selector>, Params> = EvaluateFuncWith<
      NodeFor<Selector>,
      Params
    >
  >(
    selector: Selector,
    pageFunction: Func | string,
    ...args: Params
  ): Promise<Awaited<ReturnType<Func>>>;
}
```

## Parameters

| Parameter    | Type           | Description                                                                                                                                     |
| ------------ | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| selector     | Selector       | The selector to query for.                                                                                                                      |
| pageFunction | Func \| string | The function to be evaluated in this element's page's context. The first element matching the selector will be passed in as the first argument. |
| args         | Params         | Additional arguments to pass to <code>pageFunction</code>.                                                                                      |

**Returns:**

Promise&lt;Awaited&lt;ReturnType&lt;Func&gt;&gt;&gt;

A promise to the result of the function.

## Example

```ts
const tweetHandle = await page.$('.tweet');
expect(await tweetHandle.$eval('.like', node => node.innerText)).toBe('100');
expect(await tweetHandle.$eval('.retweets', node => node.innerText)).toBe('10');
```
