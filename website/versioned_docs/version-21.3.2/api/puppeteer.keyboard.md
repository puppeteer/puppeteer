---
sidebar_label: Keyboard
---

# Keyboard class

Keyboard provides an api for managing a virtual keyboard. The high level api is [Keyboard.type()](./puppeteer.keyboard.type.md), which takes raw characters and generates proper keydown, keypress/input, and keyup events on your page.

#### Signature:

```typescript
export declare class Keyboard
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

| Method                                                       | Modifiers | Description                                                                                                                             |
| ------------------------------------------------------------ | --------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| [down(key, options)](./puppeteer.keyboard.down.md)           |           | Dispatches a <code>keydown</code> event.                                                                                                |
| [press(key, options)](./puppeteer.keyboard.press.md)         |           | Shortcut for [Keyboard.down()](./puppeteer.keyboard.down.md) and [Keyboard.up()](./puppeteer.keyboard.up.md).                           |
| [sendCharacter(char)](./puppeteer.keyboard.sendcharacter.md) |           | Dispatches a <code>keypress</code> and <code>input</code> event. This does not send a <code>keydown</code> or <code>keyup</code> event. |
| [type(text, options)](./puppeteer.keyboard.type.md)          |           | Sends a <code>keydown</code>, <code>keypress</code>/<code>input</code>, and <code>keyup</code> event for each character in the text.    |
| [up(key)](./puppeteer.keyboard.up.md)                        |           | Dispatches a <code>keyup</code> event.                                                                                                  |
