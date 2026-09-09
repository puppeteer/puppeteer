---
sidebar_label: SetContentWaitForOptions
---

# SetContentWaitForOptions interface

### Signature

```typescript
export interface SetContentWaitForOptions extends WaitForOptions
```

**Extends:** [WaitForOptions](./puppeteer.waitforoptions.md)

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

<span id="waituntil">waitUntil</span>

</td><td>

`optional`

</td><td>

Exclude&lt;[PuppeteerLifeCycleEvent](./puppeteer.puppeteerlifecycleevent.md), 'networkidle0' \| 'networkidle2'&gt; \| Array&lt;Exclude&lt;[PuppeteerLifeCycleEvent](./puppeteer.puppeteerlifecycleevent.md), 'networkidle0' \| 'networkidle2'&gt;&gt;

</td><td>

When to consider waiting succeeds. Given an array of event strings, waiting is considered to be successful after all events have been fired.

</td><td>

`'load'`

</td></tr>
</tbody></table>
