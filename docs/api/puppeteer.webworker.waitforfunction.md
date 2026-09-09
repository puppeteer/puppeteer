---
sidebar_label: WebWorker.waitForFunction
---

# WebWorker.waitForFunction() method

Waits for the provided function, `workerFunction`, to return a truthy value when evaluated in the page's context.

### Signature

```typescript
class WebWorker {
  waitForFunction<
    Params extends unknown[],
    Func extends EvaluateFunc<Params> = EvaluateFunc<Params>,
  >(
    workerFunction: Func | string,
    options?: {
      polling?: number;
      timeout?: number;
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

workerFunction

</td><td>

Func \| string

</td><td>

Function to be evaluated in browser context until it returns a truthy value.

</td></tr>
<tr><td>

options

</td><td>

&#123; polling?: number; timeout?: number; signal?: AbortSignal; &#125;

</td><td>

_(Optional)_ Options for configuring waiting behavior.

</td></tr>
<tr><td>

args

</td><td>

Params

</td><td>

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;[HandleFor](./puppeteer.handlefor.md)&lt;Awaited&lt;ReturnType&lt;Func&gt;&gt;&gt;&gt;
