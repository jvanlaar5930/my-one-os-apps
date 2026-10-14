# Button group

Multiple buttons arranged side by side or stacked, each with its own actions.

Built into OneOS. Runtime code is delivered with the installed OneOS release.

## Usage

```json
{
  "block": "button_group",
  "layout": "side_by_side",
  "buttons": [
    {
      "label": "First button",
      "action": {
        "do": "open",
        "screen": "home"
      }
    },
    {
      "label": "Second button",
      "action": {
        "do": "open",
        "screen": "home"
      }
    }
  ]
}
```

## Options

| Option | Kind | Required |
| --- | --- | --- |
| layout | oneOf | Yes |
| buttons | array | Yes |

See [definition.json](definition.json) for field bindings and bounds, and [source.vue](source.vue) for the implementation.
