---
sidebar_label: BrowserProvider.getName
---

# BrowserProvider.getName() method

Get the name of this provider. Used for error messages and logging purposes.

### Signature

```typescript
interface BrowserProvider {
  getName(): string;
}
```

**Returns:**

string

The provider name (e.g., "DefaultProvider", "CustomProvider")

## Remarks

This method is used instead of `constructor.name` to avoid issues with minification in production builds.

## Example

```ts
getName() {
  return 'MyCustomProvider';
}
```
