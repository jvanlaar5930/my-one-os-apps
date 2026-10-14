# Chart

Record counts or sums per day, week or month.

Built into OneOS. Runtime code is delivered with the installed OneOS release.

## Usage

```json
{
  "block": "chart",
  "of": "checkins",
  "date": "day",
  "by": "day",
  "last": 30
}
```

## Options

| Option | Kind | Required |
| --- | --- | --- |
| of | collection | Yes |
| date | field | Yes |
| sum | field | No |
| by | oneOf | Yes |
| last | number | Yes |
| prefix | value | No |

See [definition.json](definition.json) for field bindings and bounds, and [source.vue](source.vue) for the implementation.
