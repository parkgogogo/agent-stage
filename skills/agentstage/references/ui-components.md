# UI Components Reference

Complete reference for all available UI components in agent-stage.

## Layout Components

### Stack
Flexbox container for layout.

```json
{
  "type": "Stack",
  "props": {
    "direction": "vertical",  // "vertical" | "horizontal"
    "gap": 4,                 // number (spacing units)
    "align": "center",        // "start" | "center" | "end" | "stretch"
    "justify": "between",     // "start" | "center" | "end" | "between" | "around"
    "className": "p-4"
  },
  "children": ["child1", "child2"]
}
```

### Card
Container with optional header and styling.

```json
{
  "type": "Card",
  "props": {
    "title": "Card Title",
    "description": "Card description",
    "className": "p-6 shadow-lg"
  },
  "children": ["content"]
}
```

### Grid
CSS Grid layout.

```json
{
  "type": "Grid",
  "props": {
    "cols": 3,      // number of columns
    "gap": 4,       // gap between items
    "className": ""
  },
  "children": ["item1", "item2", "item3"]
}
```

### Separator
Visual divider line.

```json
{
  "type": "Separator",
  "props": {
    "orientation": "horizontal"  // "horizontal" | "vertical"
  }
}
```

## Typography

### Heading
Section headers.

```json
{
  "type": "Heading",
  "props": {
    "level": 2,           // 1-6 (h1-h6)
    "className": "text-xl"
  },
  "children": ["Heading Text"]
}
```

### Text
Paragraph text.

```json
{
  "type": "Text",
  "props": {
    "variant": "default",  // "default" | "muted" | "error" | "success"
    "className": ""
  },
  "children": ["Text content"]
}
```

### Badge
Status indicator.

```json
{
  "type": "Badge",
  "props": {
    "text": "Status",
    "variant": "default"  // "default" | "secondary" | "destructive" | "outline"
  }
}
```

## Input Components

### Input
Text input field.

```json
{
  "type": "Input",
  "props": {
    "label": "Email",
    "name": "email",
    "type": "email",      // "text" | "email" | "password" | "number"
    "placeholder": "Enter email",
    "$bindState": "/email"
  }
}
```

### Button
Action button.

```json
{
  "type": "Button",
  "props": {
    "label": "Click Me",
    "variant": "default",  // "default" | "secondary" | "destructive" | "outline" | "ghost"
    "size": "default",     // "default" | "sm" | "lg"
    "disabled": false
  },
  "on": {
    "press": {
      "action": "setState",
      "params": { "statePath": "/clicked", "value": true }
    }
  }
}
```

### Select
Dropdown selection.

```json
{
  "type": "Select",
  "props": {
    "label": "Country",
    "name": "country",
    "options": [
      { "value": "us", "label": "United States" },
      { "value": "uk", "label": "United Kingdom" }
    ],
    "$bindState": "/country"
  }
}
```

### Checkbox
Boolean checkbox.

```json
{
  "type": "Checkbox",
  "props": {
    "label": "I agree",
    "name": "agreed",
    "$bindState": "/agreed"
  }
}
```

### Switch
Toggle switch.

```json
{
  "type": "Switch",
  "props": {
    "label": "Notifications",
    "name": "notifications",
    "$bindState": "/notifications"
  }
}
```

### Slider
Range slider.

```json
{
  "type": "Slider",
  "props": {
    "label": "Volume",
    "name": "volume",
    "min": 0,
    "max": 100,
    "step": 1,
    "$bindState": "/volume"
  }
}
```

## Data Display

### Table
Data table with columns and rows.

```json
{
  "type": "Table",
  "props": {
    "columns": [
      { "key": "name", "header": "Name" },
      { "key": "email", "header": "Email" }
    ],
    "rows": [
      { "name": "John", "email": "john@example.com" },
      { "name": "Jane", "email": "jane@example.com" }
    ]
  }
}
```

### Tabs
Tabbed interface.

```json
{
  "type": "Tabs",
  "props": {
    "tabs": [
      {
        "id": "tab1",
        "label": "First Tab",
        "children": ["content1"]
      },
      {
        "id": "tab2",
        "label": "Second Tab",
        "children": ["content2"]
      }
    ]
  }
}
```

### Accordion
Collapsible sections.

```json
{
  "type": "Accordion",
  "props": {
    "items": [
      {
        "id": "item1",
        "title": "Section 1",
        "children": ["content1"]
      },
      {
        "id": "item2",
        "title": "Section 2",
        "children": ["content2"]
      }
    ],
    "type": "single"  // "single" | "multiple"
  }
}
```

### Dialog
Modal dialog.

```json
{
  "type": "Dialog",
  "props": {
    "title": "Confirm Action",
    "description": "Are you sure?",
    "openPath": "/dialogOpen",  // state path controlling visibility
    "children": ["dialog-content"]
  }
}
```

## Feedback Components

### Alert
Notification banner.

```json
{
  "type": "Alert",
  "props": {
    "title": "Success!",
    "description": "Operation completed.",
    "variant": "default"  // "default" | "destructive"
  }
}
```

### Progress
Progress bar.

```json
{
  "type": "Progress",
  "props": {
    "value": 75,
    "max": 100,
    "className": ""
  }
}
```

### Spinner
Loading indicator.

```json
{
  "type": "Spinner",
  "props": {
    "size": "default",  // "sm" | "default" | "lg"
    "className": ""
  }
}
```

### Skeleton
Placeholder loading state.

```json
{
  "type": "Skeleton",
  "props": {
    "className": "h-4 w-[200px]"
  }
}
```

## Navigation

### Pagination
Page navigation.

```json
{
  "type": "Pagination",
  "props": {
    "currentPage": 1,
    "totalPages": 10,
    "onPageChange": { "action": "setState", "params": { "statePath": "/page" } }
  }
}
```
