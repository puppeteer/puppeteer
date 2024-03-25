---
sidebar_label: Tracing
---

# Tracing class

The Tracing class exposes the tracing audit interface.

#### Signature:

```typescript
export declare class Tracing
```

## Remarks

You can use `tracing.start` and `tracing.stop` to create a trace file which can be opened in Chrome DevTools or [timeline viewer](https://chromedevtools.github.io/timeline-viewer/).

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `Tracing` class.

## Example

```ts
await page.tracing.start({path: 'trace.json'});
await page.goto('https://www.google.com');
await page.tracing.stop();
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

[start(options)](./puppeteer.tracing.start.md)

</td><td>

</td><td>

Starts a trace for the current page.

</td></tr>
<tr><td>

[stop()](./puppeteer.tracing.stop.md)

</td><td>

</td><td>

Stops a trace started with the `start` method.

</td></tr>
</tbody></table>
