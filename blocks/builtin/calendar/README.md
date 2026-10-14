# Calendar

A month view marking dates with records.

Built into OneOS. Runtime code is delivered with the installed OneOS release.

## Usage

```json
{
  "block": "calendar",
  "of": "checkins",
  "date": "day"
}
```

## Options

| Option | Kind | Required |
| --- | --- | --- |
| of | collection | Yes |
| date | field | Yes |
| filter | filter | No |

See [definition.json](definition.json) for field bindings and bounds, and [source.vue](source.vue) for the implementation.
