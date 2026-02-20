---
name: agentstage
description: Create and manage interactive UI pages using agent-stage CLI. Use when the user wants to build a web UI, create pages with json-render, or work with the agent-stage framework. Covers project initialization, page creation with UI JSON specs, state management, and development server operations.
---

# Agentstage Skill

Agent-stage is a CLI tool for creating interactive web UIs using JSON-render. It allows agents to define UI components via JSON specifications and manage application state.

## Core Concepts

### Project Structure

An agent-stage project follows this structure:
```
.agentstage/webapp/
├── package.json
├── src/
│   ├── routes/           # React Router route files
│   │   ├── index.tsx
│   │   └── [page-name].tsx
│   ├── pages/            # Page UI definitions and state
│   │   └── [page-name]/
│   │       ├── ui.json   # UI component specification
│   │       └── store.json # Initial state
│   ├── components/       # Shared React components
│   └── lib/             # Utilities and bridge
```

### UI JSON Specification

Pages are defined using a JSON-based UI specification:

```json
{
  "root": "main",
  "elements": {
    "main": {
      "type": "Card",
      "props": { "className": "p-6" },
      "children": ["title", "content"]
    },
    "title": {
      "type": "Heading",
      "props": { "level": 2 },
      "children": ["Page Title"]
    },
    "content": {
      "type": "Text",
      "props": { "variant": "muted" },
      "children": [{ "$state": "/message" }]
    }
  }
}
```

### State Bindings

- `{ "$state": "/path" }` - Read state value
- `{ "$bindState": "/path" }` - Two-way state binding
- `{ "$item": "fieldName" }` - List item binding
- `{ "$index": true }` - List index binding

## CLI Commands

### Project Initialization

```bash
# Initialize a new project (interactive)
agentstage dev init

# Initialize with defaults (non-interactive)
agentstage dev init --yes --skip-cloudflared-check
```

**Important**: The project is created at `~/.agentstage/webapp/` by default, NOT in the current directory.

### Development Server

```bash
# Start dev server
cd ~/.agentstage/webapp
agentstage dev start

# Start with tunnel (expose to internet)
agentstage dev start --tunnel
```

### Page Management

```bash
# Create a new page with default UI
agentstage page add mypage

# Create with custom UI JSON
agentstage page add mypage --ui '{"root":"main","elements":{...}}'

# Create with initial state
agentstage page add mypage --state '{"count":0,"name":"test"}'

# Create with both UI and state
agentstage page add mypage --ui '{...}' --state '{...}'

# List all pages
agentstage page ls

# Remove a page
agentstage page rm mypage
```

### State Management

```bash
# Get page state
agentstage run get-state mypage

# Set page state
agentstage run set-state mypage '{"key":"value"}'
```

## Available Components

### Layout Components
- `Stack` - Flexbox container (`direction`, `gap`, `align`, `justify`)
- `Card` - Card container (`title`, `description`, `className`)
- `Grid` - Grid layout (`cols`, `gap`)
- `Separator` - Visual divider

### Typography
- `Heading` - Headers (`text`, `level`: h1-h6)
- `Text` - Paragraph text (`text`, `variant`: default/muted)
- `Badge` - Status badges (`text`, `variant`)

### Inputs
- `Input` - Text input (`label`, `name`, `type`, `placeholder`)
- `Button` - Action button (`label`, `variant`, `on.press`)
- `Select` - Dropdown (`label`, `name`, `options`)
- `Checkbox` - Boolean toggle (`label`, `name`)
- `Switch` - Toggle switch (`label`, `name`)

### Data Display
- `Table` - Data table (`columns`, `rows`)
- `Tabs` - Tabbed interface (`tabs`)
- `Accordion` - Collapsible sections (`items`)
- `Dialog` - Modal dialog (`title`, `openPath`)

### Feedback
- `Alert` - Notification banner (`title`, `description`, `variant`)
- `Progress` - Progress bar (`value`, `max`)
- `Spinner` - Loading indicator
- `Skeleton` - Placeholder loading state

## Common Patterns

### Weather Display Page

```bash
# Create weather page
agentstage page add weather --state '{"location":"北京","temp":25,"condition":"☀️"}'

# Then provide UI JSON
```

```json
{
  "root": "main",
  "elements": {
    "main": {
      "type": "Card",
      "props": { "className": "p-6 max-w-md mx-auto" },
      "children": ["location", "weather-row"]
    },
    "location": {
      "type": "Heading",
      "props": { "level": 2 },
      "children": [{ "$state": "/location" }]
    },
    "weather-row": {
      "type": "Stack",
      "props": { "direction": "horizontal", "gap": 4 },
      "children": ["condition", "temp"]
    },
    "condition": {
      "type": "Text",
      "props": { "className": "text-4xl" },
      "children": [{ "$state": "/condition" }]
    },
    "temp": {
      "type": "Text",
      "props": { "className": "text-2xl" },
      "children": [{ "$state": "/temp" }, "°C"]
    }
  }
}
```

### Form with State Binding

```json
{
  "root": "form",
  "elements": {
    "form": {
      "type": "Stack",
      "props": { "gap": 4 },
      "children": ["name-input", "email-input", "submit"]
    },
    "name-input": {
      "type": "Input",
      "props": {
        "label": "Name",
        "name": "name",
        "$bindState": "/name"
      }
    },
    "email-input": {
      "type": "Input",
      "props": {
        "label": "Email",
        "name": "email",
        "type": "email",
        "$bindState": "/email"
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
    }
  }
}
```

## Troubleshooting

### Project Not Initialized
```
Error: Project not initialized
Fix: Run `agentstage dev init --yes --skip-cloudflared-check`
```

### Page Already Exists
```
Error: Page "name" already exists
Fix: Use a different name or remove with `agentstage page rm name`
```

### Invalid JSON
```
Error: Invalid UI JSON format
Fix: Ensure JSON is properly escaped and valid
```

### Port Already in Use
```
Error: Port 3000 is already in use
Fix: Stop other processes or use different port
```

## Best Practices

1. **Always initialize first**: Check if project exists before creating pages
2. **Use lowercase page names**: Only lowercase letters, numbers, and hyphens allowed
3. **Test JSON validity**: Validate UI JSON before passing to CLI
4. **Use state bindings**: Leverage `$state` and `$bindState` for dynamic content
5. **Organize pages**: Use descriptive page names that reflect functionality

## References

- [UI Components Reference](references/ui-components.md) - Full component documentation
- [State Management](references/state-management.md) - State patterns and best practices
- [Examples](references/examples.md) - Common use case examples
