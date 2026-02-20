# Examples

Common use case examples for agent-stage.

## Weather Widget

Create a weather display page:

```bash
# Initialize project
agentstage dev init --yes --skip-cloudflared-check

# Create weather page with state
agentstage page add weather --state '{
  "location": "北京",
  "temperature": 25,
  "condition": "☀️",
  "humidity": 60,
  "wind": "↗ 12km/h"
}'
```

UI JSON:

```json
{
  "root": "main",
  "elements": {
    "main": {
      "type": "Card",
      "props": { "className": "p-6 max-w-md mx-auto mt-8" },
      "children": ["location", "weather-main", "details"]
    },
    "location": {
      "type": "Heading",
      "props": { "level": 2, "className": "text-center mb-4" },
      "children": [{ "$state": "/location" }]
    },
    "weather-main": {
      "type": "Stack",
      "props": { "direction": "horizontal", "className": "items-center justify-center gap-4 mb-6" },
      "children": ["icon", "temp"]
    },
    "icon": {
      "type": "Text",
      "props": { "className": "text-6xl" },
      "children": [{ "$state": "/condition" }]
    },
    "temp": {
      "type": "Heading",
      "props": { "level": 1, "className": "text-5xl" },
      "children": [{ "$state": "/temperature" }, "°C"]
    },
    "details": {
      "type": "Grid",
      "props": { "cols": 2, "gap": 4 },
      "children": ["humidity-card", "wind-card"]
    },
    "humidity-card": {
      "type": "Card",
      "props": { "className": "p-3 bg-muted" },
      "children": ["humidity-label", "humidity-value"]
    },
    "humidity-label": {
      "type": "Text",
      "props": { "className": "text-sm text-muted-foreground" },
      "children": ["湿度"]
    },
    "humidity-value": {
      "type": "Text",
      "props": { "className": "text-lg font-semibold" },
      "children": [{ "$state": "/humidity" }, "%"]
    },
    "wind-card": {
      "type": "Card",
      "props": { "className": "p-3 bg-muted" },
      "children": ["wind-label", "wind-value"]
    },
    "wind-label": {
      "type": "Text",
      "props": { "className": "text-sm text-muted-foreground" },
      "children": ["风速"]
    },
    "wind-value": {
      "type": "Text",
      "props": { "className": "text-lg font-semibold" },
      "children": [{ "$state": "/wind" }]
    }
  }
}
```

Start server:

```bash
cd ~/.agentstage/webapp
agentstage dev start
# Open http://localhost:3000/weather
```

## Todo List

Create a todo list with add/remove functionality:

```bash
agentstage page add todos --state '{
  "todos": [
    { "id": 1, "text": "Buy groceries", "done": false },
    { "id": 2, "text": "Walk the dog", "done": true }
  ],
  "newTodo": ""
}'
```

UI JSON:

```json
{
  "root": "main",
  "elements": {
    "main": {
      "type": "Card",
      "props": { "className": "p-6 max-w-lg mx-auto" },
      "children": ["title", "input-row", "list"]
    },
    "title": {
      "type": "Heading",
      "props": { "level": 2, "className": "mb-4" },
      "children": ["Todo List"]
    },
    "input-row": {
      "type": "Stack",
      "props": { "direction": "horizontal", "gap": 2, "className": "mb-4" },
      "children": ["input", "add-btn"]
    },
    "input": {
      "type": "Input",
      "props": {
        "placeholder": "Add new task...",
        "$bindState": "/newTodo"
      }
    },
    "add-btn": {
      "type": "Button",
      "props": { "label": "Add" },
      "on": {
        "press": {
          "action": "pushState",
          "params": {
            "statePath": "/todos",
            "value": { "id": { "$eval": "Date.now()" }, "text": { "$state": "/newTodo" }, "done": false }
          }
        }
      }
    }
  }
}
```

## Dashboard Card

Display metrics in a dashboard:

```bash
agentstage page add dashboard --state '{
  "metrics": {
    "users": 1234,
    "revenue": 5678,
    "orders": 89
  },
  "period": "Today"
}'
```

UI JSON:

```json
{
  "root": "main",
  "elements": {
    "main": {
      "type": "Stack",
      "props": { "gap": 4 },
      "children": ["header", "grid"]
    },
    "header": {
      "type": "Stack",
      "props": { "direction": "horizontal", "className": "justify-between items-center" },
      "children": ["title", "period"]
    },
    "title": {
      "type": "Heading",
      "props": { "level": 2 },
      "children": ["Dashboard"]
    },
    "period": {
      "type": "Badge",
      "props": {
        "text": { "$state": "/period" },
        "variant": "secondary"
      }
    },
    "grid": {
      "type": "Grid",
      "props": { "cols": 3, "gap": 4 },
      "children": ["users-card", "revenue-card", "orders-card"]
    },
    "users-card": {
      "type": "Card",
      "props": { "className": "p-4" },
      "children": ["users-label", "users-value"]
    },
    "users-label": {
      "type": "Text",
      "props": { "variant": "muted", "className": "text-sm" },
      "children": ["Users"]
    },
    "users-value": {
      "type": "Heading",
      "props": { "level": 3, "className": "text-3xl" },
      "children": [{ "$state": "/metrics/users" }]
    },
    "revenue-card": {
      "type": "Card",
      "props": { "className": "p-4" },
      "children": ["revenue-label", "revenue-value"]
    },
    "revenue-label": {
      "type": "Text",
      "props": { "variant": "muted", "className": "text-sm" },
      "children": ["Revenue"]
    },
    "revenue-value": {
      "type": "Heading",
      "props": { "level": 3, "className": "text-3xl" },
      "children": ["$", { "$state": "/metrics/revenue" }]
    },
    "orders-card": {
      "type": "Card",
      "props": { "className": "p-4" },
      "children": ["orders-label", "orders-value"]
    },
    "orders-label": {
      "type": "Text",
      "props": { "variant": "muted", "className": "text-sm" },
      "children": ["Orders"]
    },
    "orders-value": {
      "type": "Heading",
      "props": { "level": 3, "className": "text-3xl" },
      "children": [{ "$state": "/metrics/orders" }]
    }
  }
}
```

## User Profile Form

Create a user profile form with validation:

```bash
agentstage page add profile --state '{
  "profile": {
    "name": "",
    "email": "",
    "bio": ""
  },
  "saved": false
}'
```

UI JSON:

```json
{
  "root": "main",
  "elements": {
    "main": {
      "type": "Card",
      "props": { "className": "p-6 max-w-md mx-auto" },
      "children": ["title", "form", "success"]
    },
    "title": {
      "type": "Heading",
      "props": { "level": 2, "className": "mb-4" },
      "children": ["Profile"]
    },
    "form": {
      "type": "Stack",
      "props": { "gap": 4 },
      "children": ["name", "email", "bio", "save"]
    },
    "name": {
      "type": "Input",
      "props": {
        "label": "Name",
        "name": "name",
        "$bindState": "/profile/name"
      }
    },
    "email": {
      "type": "Input",
      "props": {
        "label": "Email",
        "name": "email",
        "type": "email",
        "$bindState": "/profile/email"
      }
    },
    "bio": {
      "type": "Input",
      "props": {
        "label": "Bio",
        "name": "bio",
        "placeholder": "Tell us about yourself...",
        "$bindState": "/profile/bio"
      }
    },
    "save": {
      "type": "Button",
      "props": { "label": "Save Profile", "className": "w-full" },
      "on": {
        "press": {
          "action": "setState",
          "params": { "statePath": "/saved", "value": true }
        }
      }
    },
    "success": {
      "type": "Alert",
      "props": {
        "title": "Profile Saved!",
        "variant": "default"
      }
    }
  }
}
```

## Loading State

Show loading skeletons while data loads:

```bash
agentstage page add loading-demo --state '{
  "loading": true,
  "data": null
}'
```

UI JSON:

```json
{
  "root": "main",
  "elements": {
    "main": {
      "type": "Card",
      "props": { "className": "p-6 max-w-md mx-auto" },
      "children": ["title", "content"]
    },
    "title": {
      "type": "Heading",
      "props": { "level": 2 },
      "children": ["Loading Example"]
    },
    "content": {
      "type": "Stack",
      "props": { "gap": 4 },
      "children": ["skeleton1", "skeleton2", "skeleton3"]
    },
    "skeleton1": {
      "type": "Skeleton",
      "props": { "className": "h-4 w-[250px]" }
    },
    "skeleton2": {
      "type": "Skeleton",
      "props": { "className": "h-4 w-[200px]" }
    },
    "skeleton3": {
      "type": "Skeleton",
      "props": { "className": "h-4 w-[300px]" }
    }
  }
}
```
