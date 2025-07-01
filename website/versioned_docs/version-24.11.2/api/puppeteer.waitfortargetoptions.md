---
sidebar_label: WaitForTargetOptions
---

# WaitForTargetOptions interface

### Signature

```typescript
export interface WaitForTargetOptions
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

A signal object that allows you to cancel a waitFor call.

</td><td>

</td></tr>
<tr><td>

<span id="timeout">timeout</span>

</td><td>

`optional`

</td><td>

number

</td><td>

Maximum wait time in milliseconds. Pass `0` to disable the timeout.

</td><td>

`30_000`

</td></tr>
</tbody></table>
