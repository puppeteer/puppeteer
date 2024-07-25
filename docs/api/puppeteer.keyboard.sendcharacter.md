---
sidebar_label: Keyboard.sendCharacter
---

# Keyboard.sendCharacter() method

Dispatches a `keypress` and `input` event. This does not send a `keydown` or `keyup` event.

### Signature

```typescript
class Keyboard {
  abstract sendCharacter(char: string): Promise<void>;
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

char

</td><td>

string

</td><td>

Character to send into the page.

</td></tr>
</tbody></table>
**Returns:**

Promise&lt;void&gt;

## Remarks

Modifier keys DO NOT effect [Keyboard.sendCharacter](./puppeteer.keyboard.sendcharacter.md). Holding down `Shift` will not type the text in upper case.

## Example

```ts
page.keyboard.sendCharacter('嗨');
```
