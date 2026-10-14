# Plot

Compare numeric series as line, grouped bar or area charts.

Built into OneOS. Runtime code is delivered with the installed OneOS release.

## Usage

```json
{
  "block": "plot",
  "of": "habits",
  "x": "name",
  "y": "goal",
  "type": "bar"
}
```

## Options

| Option | Kind | Required |
| --- | --- | --- |
| of | collection | Yes |
| x | field | Yes |
| y | field | Yes |
| series | field | No |
| type | oneOf | Yes |
| title | text | No |
| unit | text | No |
| aggregate | oneOf | No |
| limit | number | No |
| filter | filter | No |

See [definition.json](definition.json) for field bindings and bounds, and [source.vue](source.vue) for the implementation.
