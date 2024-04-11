---
sidebar_label: WaitForSelectorOptions
---

# WaitForSelectorOptions interface

#### Signature:

```typescript
export interface WaitForSelectorOptions
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

<span id="hidden">hidden</span>

</td><td>

`optional`

</td><td>

boolean

</td><td>

Wait for the selected element to not be found in the DOM or to be hidden, i.e. have `display: none` or `visibility: hidden` CSS properties.

</td><td>

`false`

</td></tr>
<tr><td>

<span id="signal">signal</span>

</td><td>

`optional`

</td><td>

AbortSignal

</td><td>

A signal object that allows you to cancel a waitForSelector call.

</td><td>

</td></tr>
<tr><td>

<span id="timeout">timeout</span>

</td><td>

`optional`

</td><td>

number

</td><td>

Maximum time to wait in milliseconds. Pass `0` to disable timeout.

The default value can be changed by using [Page.setDefaultTimeout()](./puppeteer.page.setdefaulttimeout.md)

</td><td>

`30_000` (30 seconds)

</td></tr>
<tr><td>

<span id="visible">visible</span>

</td><td>

`optional`

</td><td>

boolean

</td><td>

Wait for the selected element to be present in DOM and to be visible, i.e. to not have `display: none` or `visibility: hidden` CSS properties.

</td><td>

`false`

</td></tr>
</tbody></table>
