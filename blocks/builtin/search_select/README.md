# Search and select

Live autocomplete from a declared source; copies selected result fields into saved records.

Built into OneOS. Runtime code is delivered with the installed OneOS release.

## Usage

```json
{
  "block": "search_select",
  "source": "lookup",
  "results": "items",
  "query_param": "name",
  "title": "name",
  "to": "saved",
  "copy": {
    "name": "name"
  }
}
```

## Options

| Option | Kind | Required |
| --- | --- | --- |
| source | source | Yes |
| results | collection | Yes |
| query_param | text | Yes |
| title | field | Yes |
| subtitle | field | No |
| to | collection | Yes |
| copy | fieldMap | Yes |
| label | text | No |
| min_chars | number | No |
| limit | number | No |
| then | screen | No |

See [definition.json](definition.json) for field bindings and bounds, and [source.vue](source.vue) for the implementation.
