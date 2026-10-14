# Totals

Record counts or sums, optionally by category and current week or month.

Built into OneOS. Runtime code is delivered with the installed OneOS release.

## Usage

```json
{
  "block": "totals",
  "of": "items"
}
```

## Options

| Option | Kind | Required |
| --- | --- | --- |
| of | collection | Yes |
| sum | field | No |
| by | field | No |
| period | group | No |
| prefix | value | No |

See [definition.json](definition.json) for field bindings and bounds, and [source.vue](source.vue) for the implementation.
