---
sidebar_label: Keyboard.up
---

# Keyboard.up() method

Dispatches a `keyup` event.

### Signature

```typescript
class Keyboard {
  abstract up(key: KeyInput): Promise<void>;
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

key

</td><td>

[KeyInput](./puppeteer.keyinput.md)

</td><td>

Name of key to release, such as `ArrowLeft`. See [KeyInput](./puppeteer.keyinput.md) for a list of all key names.

</td></tr>
</tbody></table>
**Returns:**

Promise&lt;void&gt;
