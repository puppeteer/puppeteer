---
sidebar_label: AutofillData
---

# AutofillData type

### Signature

```typescript
export type AutofillData =
  | {
      creditCard: {
        number: string;
        name: string;
        expiryMonth: string;
        expiryYear: string;
        cvc: string;
      };
      address?: never;
    }
  | {
      address: {
        fields: Array<{
          name: AutofillAddressField | (string & Record<never, never>);
          value: string;
        }>;
      };
      creditCard?: never;
    };
```

**References:** [AutofillAddressField](./puppeteer.autofilladdressfield.md)
