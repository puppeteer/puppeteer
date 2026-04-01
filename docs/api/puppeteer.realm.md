---
sidebar_label: Realm
---

# Realm class

### Signature

```typescript
export declare abstract class Realm implements Disposable
```

**Implements:** Disposable

## Remarks

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `Realm` class.

## Properties

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

<span id="worldid">worldId</span>

</td><td>

</td><td>

string \| symbol

</td><td>

The identifier for this realm.

</td></tr>
</tbody></table>

## Methods

<table><thead><tr><th>

Method

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

<span id="evaluate">[evaluate(pageFunction, args)](./puppeteer.realm.evaluate.md)</span>

</td><td>

</td><td>

</td></tr>
<tr><td>

<span id="evaluatehandle">[evaluateHandle(pageFunction, args)](./puppeteer.realm.evaluatehandle.md)</span>

</td><td>

</td><td>

</td></tr>
<tr><td>

<span id="extension">[extension()](./puppeteer.realm.extension.md)</span>

</td><td>

</td><td>

This method returns the extension from the ExecutionContext paired with the realm at the moment of the execution.

</td></tr>
<tr><td>

<span id="waitforfunction">[waitForFunction(pageFunction, options, args)](./puppeteer.realm.waitforfunction.md)</span>

</td><td>

</td><td>

</td></tr>
</tbody></table>
