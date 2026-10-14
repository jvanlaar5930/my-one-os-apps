# Refresh saved items

Refreshes a scoped source for each saved record using field-to-parameter bindings, with progress and honest errors.

Built into OneOS. Runtime code is delivered with the installed OneOS release.

## Usage

```json
{
  "block": "collection_refresh",
  "of": "saved",
  "source": "details",
  "params": {
    "name": "name"
  }
}
```

## Options

| Option | Kind | Required |
| --- | --- | --- |
| of | collection | Yes |
| source | source | Yes |
| params | fieldMap | Yes |
| filter | filter | No |
| label | text | No |

See [definition.json](definition.json) for field bindings and bounds, and [source.vue](source.vue) for the implementation.
