---
sidebar_label: FrameWaitForFunctionOptions
---

# FrameWaitForFunctionOptions interface

### Signature

```typescript
export interface FrameWaitForFunctionOptions
```

## Properties

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th><th>

Default

</th></tr></thead>
<tbody><tr><td>

<span id="polling">polling</span>

</td><td>

`optional`

</td><td>

'raf' \| 'mutation' \| number

</td><td>

An interval at which the `pageFunction` is executed, defaults to `raf`. If `polling` is a number, then it is treated as an interval in milliseconds at which the function would be executed. If `polling` is a string, then it can be one of the following values:

- `raf` - to constantly execute `pageFunction` in `requestAnimationFrame` callback. This is the tightest polling mode which is suitable to observe styling changes.

- `mutation` - to execute `pageFunction` on every DOM mutation.

</td><td>

</td></tr>
<tr><td>

<span id="signal">signal</span>

</td><td>

`optional`

</td><td>

AbortSignal

</td><td>

A signal object that allows you to cancel a waitForFunction call.

</td><td>

</td></tr>
<tr><td>

<span id="timeout">timeout</span>

</td><td>

`optional`

</td><td>

number

</td><td>

Maximum time to wait in milliseconds. Defaults to `30000` (30 seconds). Pass `0` to disable the timeout. Puppeteer's default timeout can be changed using [Page.setDefaultTimeout()](./puppeteer.page.setdefaulttimeout.md).

</td><td>

</td></tr>
</tbody></table>
