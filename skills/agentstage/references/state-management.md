# State Management

State management patterns and best practices for agent-stage.

## State Structure

Each page has a `store.json` file:

```json
{
  "state": {
    "key1": "value1",
    "key2": 42,
    "nested": {
      "field": "value"
    }
  },
  "version": 1,
  "updatedAt": "2026-02-20T02:21:47.677Z",
  "pageId": "weather"
}
```

## State Bindings

### Read State ($state)

Display a state value:

```json
{
  "type": "Text",
  "props": {},
  "children": [{ "$state": "/temperature" }, "°C"]
}
```

### Two-Way Binding ($bindState)

Form inputs with automatic state synchronization:

```json
{
  "type": "Input",
  "props": {
    "label": "Name",
    "name": "name",
    "$bindState": "/user/name"
  }
}
```

### List Items ($item)

Iterate over arrays:

```json
{
  "root": "list",
  "elements": {
    "list": {
      "type": "Stack",
      "props": {},
      "children": { "$state": "/items" }
    },
    "item": {
      "type": "Text",
      "props": {},
      "children": [{ "$item": "name" }]
    }
  }
}
```

## Actions

### setState

Update a state value:

```json
{
  "type": "Button",
  "props": { "label": "Increment" },
  "on": {
    "press": {
      "action": "setState",
      "params": {
        "statePath": "/count",
        "value": 10
      }
    }
  }
}
```

### pushState

Add to an array:

```json
{
  "action": "pushState",
  "params": {
    "statePath": "/todos",
    "value": { "text": "New task", "done": false }
  }
}
```

### removeState

Remove from an array by index:

```json
{
  "action": "removeState",
  "params": {
    "statePath": "/todos",
    "index": 2
  }
}
```

## Patterns

### Counter

```json
{
  "state": { "count": 0 }
}
```

```json
{
  "root": "counter",
  "elements": {
    "counter": {
      "type": "Card",
      "props": { "className": "p-4" },
      "children": ["display", "buttons"]
    },
    "display": {
      "type": "Heading",
      "props": { "level": 2 },
      "children": ["Count: ", { "$state": "/count" }]
    },
    "buttons": {
      "type": "Stack",
      "props": { "direction": "horizontal", "gap": 2 },
      "children": ["inc", "dec"]
    },
    "inc": {
      "type": "Button",
      "props": { "label": "+" },
      "on": {
        "press": {
          "action": "setState",
          "params": { "statePath": "/count", "value": { "$eval": "state.count + 1" } }
        }
      }
    }
  }
}
```

### Form Handling

```json
{
  "state": {
    "form": { "name": "", "email": "" },
    "submitted": false
  }
}
```

```json
{
  "root": "form-card",
  "elements": {
    "form-card": {
      "type": "Card",
      "props": { "title": "Contact Form" },
      "children": ["name", "email", "submit", "success"]
    },
    "name": {
      "type": "Input",
      "props": {
        "label": "Name",
        "name": "name",
        "$bindState": "/form/name"
      }
    },
    "email": {
      "type": "Input",
      "props": {
        "label": "Email",
        "name": "email",
        "type": "email",
        "$bindState": "/form/email"
      }
    },
    "submit": {
      "type": "Button",
      "props": { "label": "Submit" },
      "on": {
        "press": {
          "action": "setState",
          "params": { "statePath": "/submitted", "value": true }
        }
      }
    },
    "success": {
      "type": "Alert",
      "props": {
        "title": "Success!",
        "description": "Form submitted.",
        "variant": "default"
      }
    }
  }
}
```

### Conditional Display

Use state to conditionally show elements:

```json
{
  "state": { "showDetails": false }
}
```

```json
{
  "root": "container",
  "elements": {
    "container": {
      "type": "Stack",
      "props": {},
      "children": ["toggle", "details"]
    },
    "toggle": {
      "type": "Button",
      "props": { "label": "Toggle Details" },
      "on": {
        "press": {
          "action": "setState",
          "params": { "statePath": "/showDetails", "value": { "$eval": "!state.showDetails" } }
        }
      }
    }
  }
}
```

## CLI State Commands

### Get State

```bash
agentstage run get-state <page-name>
```

### Set State

```bash
agentstage run set-state <page-name> '<json>'
```

Example:

```bash
agentstage run set-state weather '{"temperature": 30, "condition": "☀️"}'
```

## Best Practices

1. **Keep state flat**: Avoid deeply nested structures when possible
2. **Use consistent naming**: camelCase for state keys
3. **Initialize all values**: Provide defaults in initial state
4. **Group related data**: Use objects for related fields
5. **Avoid derived state**: Calculate values in UI rather than storing
