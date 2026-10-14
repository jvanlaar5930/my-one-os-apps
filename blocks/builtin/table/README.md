# Table

Searchable collection columns with field labels, formatting and optional record navigation.

Built into OneOS. Runtime code is delivered with the installed OneOS release.

## Usage

```json
{
  "block": "table",
  "of": "items",
  "columns": [
    "name"
  ]
}
```

## Options

| Option | Kind | Required |
| --- | --- | --- |
| of | collection | Yes |
| columns | fields | Yes |
| title | text | No |
| search | fields | No |
| filter | filter | No |
| sort | group | No |
| open | screen | No |
| limit | number | No |

See [definition.json](definition.json) for field bindings and bounds, and [source.vue](source.vue) for the implementation.
