# List

Records of a collection, with optional weekly progress.

Built into OneOS. Runtime code is delivered with the installed OneOS release.

## Usage

```json
{
  "block": "list",
  "of": "items",
  "title": "name"
}
```

## Options

| Option | Kind | Required |
| --- | --- | --- |
| of | collection | Yes |
| title | field | Yes |
| subtitle | field | No |
| filter | filter | No |
| sort | group | No |
| search | fields | No |
| prefix | value | No |
| open | screen | No |
| add | screen | No |
| progress | group | No |

See [definition.json](definition.json) for field bindings and bounds, and [source.vue](source.vue) for the implementation.
