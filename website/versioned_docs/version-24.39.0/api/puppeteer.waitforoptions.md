---
sidebar_label: WaitForOptions
---

# WaitForOptions interface

### Signature

```typescript
export interface WaitForOptions
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

<span id="signal">signal</span>

</td><td>

`optional`

</td><td>

AbortSignal

</td><td>

A signal object that allows you to cancel the call.

</td><td>

</td></tr>
<tr><td>

<span id="timeout">timeout</span>

</td><td>

`optional`

</td><td>

number

</td><td>

Maximum wait time in milliseconds. Pass 0 to disable the timeout.

The default value can be changed by using the [Page.setDefaultTimeout()](./puppeteer.page.setdefaulttimeout.md) or [Page.setDefaultNavigationTimeout()](./puppeteer.page.setdefaultnavigationtimeout.md) methods.

</td><td>

`30000`

</td></tr>
<tr><td>

<span id="waituntil">waitUntil</span>

</td><td>

`optional`

</td><td>

[PuppeteerLifeCycleEvent](./puppeteer.puppeteerlifecycleevent.md) \| [PuppeteerLifeCycleEvent](./puppeteer.puppeteerlifecycleevent.md)\[\]

</td><td>

When to consider waiting succeeds. Given an array of event strings, waiting is considered to be successful after all events have been fired.

</td><td>

`'load'`

</td></tr>
</tbody></table>
