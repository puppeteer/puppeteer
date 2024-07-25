---
sidebar_label: Keyboard
---

# Keyboard class

Keyboard provides an api for managing a virtual keyboard. The high level api is [Keyboard.type()](./puppeteer.keyboard.type.md), which takes raw characters and generates proper keydown, keypress/input, and keyup events on your page.

### Signature

```typescript
export declare abstract class Keyboard
```

## Remarks

For finer control, you can use [Keyboard.down()](./puppeteer.keyboard.down.md), [Keyboard.up()](./puppeteer.keyboard.up.md), and [Keyboard.sendCharacter()](./puppeteer.keyboard.sendcharacter.md) to manually fire events as if they were generated from a real keyboard.

On macOS, keyboard shortcuts like `⌘ A` -&gt; Select All do not work. See [\#1313](https://github.com/puppeteer/puppeteer/issues/1313).

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `Keyboard` class.

## Example 1

An example of holding down `Shift` in order to select and delete some text:

```ts
await page.keyboard.type('Hello World!');
await page.keyboard.press('ArrowLeft');

await page.keyboard.down('Shift');
for (let i = 0; i < ' World'.length; i++)
  await page.keyboard.press('ArrowLeft');
await page.keyboard.up('Shift');

await page.keyboard.press('Backspace');
// Result text will end up saying 'Hello!'
```

## Example 2

An example of pressing `A`

```ts
await page.keyboard.down('Shift');
await page.keyboard.press('KeyA');
await page.keyboard.up('Shift');
```

## Methods

<table><thead><tr><th>

Method

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

<span id="down">[down(key, options)](./puppeteer.keyboard.down.md)</span>

</td><td>

</td><td>

Dispatches a `keydown` event.

**Remarks:**

If `key` is a single character and no modifier keys besides `Shift` are being held down, a `keypress`/`input` event will also generated. The `text` option can be specified to force an input event to be generated. If `key` is a modifier key, `Shift`, `Meta`, `Control`, or `Alt`, subsequent key presses will be sent with that modifier active. To release the modifier key, use [Keyboard.up()](./puppeteer.keyboard.up.md).

After the key is pressed once, subsequent calls to [Keyboard.down()](./puppeteer.keyboard.down.md) will have [repeat](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/repeat) set to true. To release the key, use [Keyboard.up()](./puppeteer.keyboard.up.md).

Modifier keys DO influence [Keyboard.down()](./puppeteer.keyboard.down.md). Holding down `Shift` will type the text in upper case.

</td></tr>
<tr><td>

<span id="press">[press(key, options)](./puppeteer.keyboard.press.md)</span>

</td><td>

</td><td>

Shortcut for [Keyboard.down()](./puppeteer.keyboard.down.md) and [Keyboard.up()](./puppeteer.keyboard.up.md).

**Remarks:**

If `key` is a single character and no modifier keys besides `Shift` are being held down, a `keypress`/`input` event will also generated. The `text` option can be specified to force an input event to be generated.

Modifier keys DO effect [Keyboard.press()](./puppeteer.keyboard.press.md). Holding down `Shift` will type the text in upper case.

</td></tr>
<tr><td>

<span id="sendcharacter">[sendCharacter(char)](./puppeteer.keyboard.sendcharacter.md)</span>

</td><td>

</td><td>

Dispatches a `keypress` and `input` event. This does not send a `keydown` or `keyup` event.

**Remarks:**

Modifier keys DO NOT effect [Keyboard.sendCharacter](./puppeteer.keyboard.sendcharacter.md). Holding down `Shift` will not type the text in upper case.

</td></tr>
<tr><td>

<span id="type">[type(text, options)](./puppeteer.keyboard.type.md)</span>

</td><td>

</td><td>

Sends a `keydown`, `keypress`/`input`, and `keyup` event for each character in the text.

**Remarks:**

To press a special key, like `Control` or `ArrowDown`, use [Keyboard.press()](./puppeteer.keyboard.press.md).

Modifier keys DO NOT effect `keyboard.type`. Holding down `Shift` will not type the text in upper case.

</td></tr>
<tr><td>

<span id="up">[up(key)](./puppeteer.keyboard.up.md)</span>

</td><td>

</td><td>

Dispatches a `keyup` event.

</td></tr>
</tbody></table>
