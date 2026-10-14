# Button

Runs an action or a sequence of actions.

Built into OneOS. Runtime code is delivered with the installed OneOS release.

## Usage

```json
{
  "block": "button",
  "label": "Go",
  "action": {
    "do": "open",
    "screen": "home"
  }
}
```

## Options

| Option | Kind | Required |
| --- | --- | --- |
| label | text | Yes |
| action | action | Yes |

See [definition.json](definition.json) for field bindings and bounds, and [source.vue](source.vue) for the implementation.
