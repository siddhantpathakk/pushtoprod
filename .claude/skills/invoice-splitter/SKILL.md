---
name: invoice-splitter
description: Use when the user asks to split a bill, receipt, or invoice among multiple people. Accepts a receipt image (path or URL) and a number of people. Reads the line items via vision and returns an itemized split plus per-person totals.
---

# Invoice Splitter

Split a restaurant bill, receipt, or invoice among N people using Claude's
vision capability.

## When to use

Trigger when the user says any of:

- "split this bill 3 ways"
- "how much do we each owe"
- "divide this receipt"
- "split the dinner check"

The user will provide either a path to an image (`.jpg`, `.png`, `.webp`,
`.heic`) or a URL.

## How it works

1. Read the image using your built-in vision capability — extract:
   - Each line item (description, quantity, unit price, total)
   - Subtotal, tax, tip, grand total
2. Compute the equal-split per person: `grand_total / n`.
3. (Optional) If the user named specific items per person, allocate those
   first then split the shared items.
4. Return:
   - A markdown table of line items
   - The grand total
   - Per-person amount(s) to the nearest cent

## Output format

```
| Item              | Qty | Unit | Total |
|-------------------|-----|------|-------|
| Margherita pizza  |  1  | $18  | $18   |
| ...                                    |
| **Subtotal**                    | $XX  |
| Tax (8%)                        | $X   |
| **Grand total**                 | $XX  |

Split 3 ways: **$X.XX per person**
```

## Notes

- Always show the line items so the user can sanity-check the OCR.
- Round halves up so totals reconcile.
- If the image is unreadable, ask for a clearer photo rather than guessing.
