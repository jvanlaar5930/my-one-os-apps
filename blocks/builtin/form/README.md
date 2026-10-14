# Form

Adds a record, or edits the screen's record if it has one.

Built into OneOS. Runtime code is delivered with the installed OneOS release.

## Usage

```json
{
  "block": "form",
  "of": "items"
}
```

## Options

| Option | Kind | Required |
| --- | --- | --- |
| of | collection | Yes |
| fields | fields | No |
| then | screen | No |

See [definition.json](definition.json) for field bindings and bounds, and [source.vue](source.vue) for the implementation.
