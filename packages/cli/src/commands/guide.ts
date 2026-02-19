import { Command } from 'commander';
import consola from 'consola';
import c from 'picocolors';

/**
 * Agent 指引系统 - 帮助 AI Agent 理解和使用 CLI
 */

interface GuideSection {
  title: string;
  description: string;
  examples: Array<{
    scenario: string;
    command: string;
    explanation: string;
  }>;
  commonErrors: Array<{
    error: string;
    cause: string;
    fix: string;
  }>;
}

const guides: Record<string, GuideSection> = {
  'quickstart': {
    title: 'Quick Start for Agents',
    description: 'Get started with agentstage in 3 steps',
    examples: [
      {
        scenario: '1. Initialize project (first time only)',
        command: 'agentstage init',
        explanation: 'Creates a new project with all necessary files'
      },
      {
        scenario: '2. Create a page',
        command: 'agentstage page add mypage --ui \'{...}\' --state \'{...}\'',
        explanation: 'Creates a page with UI and initial state'
      },
      {
        scenario: '3. Start dev server',
        command: 'agentstage dev start',
        explanation: 'Starts the development server'
      }
    ],
    commonErrors: [
      {
        error: 'Project not initialized',
        cause: 'You tried to create a page before initializing',
        fix: 'Run: agentstage init'
      }
    ]
  },
  
  'page-add': {
    title: 'Creating Pages',
    description: 'How to create pages with json-render UI',
    examples: [
      {
        scenario: 'Create page with complete UI',
        command: 'agentstage page add todo --ui \'{"root":"main","elements":{...}}\' --state \'{"items":[]}\'',
        explanation: 'Creates page with UI spec and initial state'
      },
      {
        scenario: 'Create empty page (get prompts)',
        command: 'agentstage page add todo',
        explanation: 'Creates page with default UI and outputs prompts for AI'
      },
      {
        scenario: 'Create page from stdin (for large JSON)',
        command: 'echo \'{...}\' | agentstage page add todo --ui-stdin --state \'{...}\'',
        explanation: 'Use stdin when UI JSON is too large for command line'
      }
    ],
    commonErrors: [
      {
        error: 'Invalid UI JSON provided',
        cause: 'The --ui JSON is malformed or missing required fields',
        fix: 'Validate your JSON. Required: {"root": "string", "elements": {}}'
      },
      {
        error: 'Page "xxx" already exists',
        cause: 'A page with this name already exists',
        fix: 'Use a different name, or remove existing: agentstage page rm xxx --force'
      },
      {
        error: 'Page name must be lowercase letters, numbers, and hyphens',
        cause: 'Name contains invalid characters',
        fix: 'Use only: a-z, 0-9, - (e.g., "my-page", "todo-app")'
      }
    ]
  },

  'ui-json': {
    title: 'UI JSON Format',
    description: 'Complete guide to json-render UI specification',
    examples: [
      {
        scenario: 'Basic structure',
        command: '',
        explanation: `{
  "root": "element-id",
  "elements": {
    "element-id": {
      "type": "ComponentName",
      "props": { "key": "value" },
      "children": ["child-id-1", "child-id-2"],
      "on": { "event": { "action": "...", "params": {} } }
    }
  }
}`
      },
      {
        scenario: 'Available components',
        command: '',
        explanation: `Layout: Stack, Card, Separator, Grid
Typography: Heading, Text, Badge
Inputs: Input, Button, Select, Checkbox, Radio, Switch, Slider
Data: Table, Tabs, Dialog, Accordion, Carousel
Feedback: Alert, Badge, Progress, Skeleton, Spinner
Navigation: Tabs, Pagination`
      },
      {
        scenario: 'State bindings',
        command: '',
        explanation: `Read state: { "$state": "/path" }
Two-way bind: { "$bindState": "/path" }
List item: { "$item": "fieldName" }
List index: { "$index": true }`
      },
      {
        scenario: 'Built-in actions',
        command: '',
        explanation: `setState: Update value at path
pushState: Append to array
removeState: Remove from array by index
push/pop: Navigate forward/back`
      }
    ],
    commonErrors: [
      {
        error: 'UI not rendering',
        cause: 'Invalid component type or missing required props',
        fix: 'Check component name spelling. Use available components only.'
      },
      {
        error: 'State not showing in UI',
        cause: '$state path is wrong or state is not initialized',
        fix: 'Verify state path exists in store.json. Use agentstage run get-state <page> to check.'
      }
    ]
  },

  'state-management': {
    title: 'Managing State',
    description: 'How to read and update page state',
    examples: [
      {
        scenario: 'Set state (file only)',
        command: 'agentstage run set-state mypage \'{"count": 5}\'',
        explanation: 'Updates state in store.json. Page will see changes on reload.'
      },
      {
        scenario: 'Set state (live update)',
        command: 'agentstage run set-state mypage \'{"count": 5}\' --live',
        explanation: 'Updates state and pushes to connected browser immediately'
      },
      {
        scenario: 'Get current state',
        command: 'agentstage run get-state mypage',
        explanation: 'Reads current state from file or live connection'
      },
      {
        scenario: 'Watch state changes',
        command: 'agentstage run watch mypage',
        explanation: 'Streams state changes in real-time'
      }
    ],
    commonErrors: [
      {
        error: 'Page "xxx" is not connected',
        cause: 'Using --live but page is not open in browser',
        fix: 'Remove --live flag, or open the page in browser first'
      },
      {
        error: 'Runtime is not running',
        cause: 'Dev server is not started',
        fix: 'Run: agentstage dev start'
      }
    ]
  },

  'validate': {
    title: 'Validating Your Work',
    description: 'Check your UI JSON and state before applying',
    examples: [
      {
        scenario: 'Validate UI JSON',
        command: 'agentstage validate ui mypage',
        explanation: 'Checks if ui.json has valid structure and components'
      },
      {
        scenario: 'Validate state',
        command: 'agentstage validate state mypage',
        explanation: 'Checks if state JSON is valid'
      },
      {
        scenario: 'Validate all pages',
        command: 'agentstage validate --all',
        explanation: 'Validates all pages in the project'
      }
    ],
    commonErrors: [
      {
        error: 'Invalid component type: "Xxx"',
        cause: 'Using a component that does not exist',
        fix: 'Check available components with: agentstage guide ui-json'
      },
      {
        error: 'Missing required prop: "xxx"',
        cause: 'Component requires a prop that is not provided',
        fix: 'Add the required prop to the component'
      }
    ]
  }
};

export const guideCommand = new Command('guide')
  .description('Get guidance for using agentstage (for AI Agents)')
  .argument('[topic]', 'Topic to get guidance on (quickstart, page-add, ui-json, state-management, validate)')
  .option('--list', 'List all available topics')
  .action(async (topic, options) => {
    if (options.list || !topic) {
      console.log();
      console.log(c.bold('📚 Agent Guide Topics'));
      console.log();
      console.log(c.dim('Run: agentstage guide <topic>'));
      console.log();
      Object.entries(guides).forEach(([key, guide]) => {
        console.log(`  ${c.cyan(key.padEnd(20))} ${c.gray(guide.description)}`);
      });
      console.log();
      console.log(c.dim('Example:'));
      console.log(`  ${c.cyan('agentstage guide quickstart')}`);
      console.log(`  ${c.cyan('agentstage guide ui-json')}`);
      console.log();
      return;
    }

    const guide = guides[topic];
    if (!guide) {
      console.log();
      consola.error(`Unknown topic: "${topic}"`);
      console.log();
      console.log(c.dim('Available topics:'));
      Object.keys(guides).forEach(key => {
        console.log(`  ${c.cyan(key)}`);
      });
      console.log();
      console.log(c.dim(`Run: agentstage guide --list`));
      console.log();
      process.exit(1);
    }

    console.log();
    console.log(c.bold('═'.repeat(70)));
    console.log(c.bold(`📖 ${guide.title}`));
    console.log(c.bold('═'.repeat(70)));
    console.log();
    console.log(c.gray(guide.description));
    console.log();

    if (guide.examples.length > 0) {
      console.log(c.bold('Examples:'));
      console.log();
      guide.examples.forEach((ex, i) => {
        console.log(c.yellow(`${i + 1}. ${ex.scenario}`));
        if (ex.command) {
          console.log(c.cyan(`   $ ${ex.command}`));
        }
        console.log(c.gray(`   ${ex.explanation}`));
        console.log();
      });
    }

    if (guide.commonErrors.length > 0) {
      console.log(c.bold('Common Errors & Fixes:'));
      console.log();
      guide.commonErrors.forEach((err, i) => {
        console.log(c.red(`❌ ${err.error}`));
        console.log(c.gray(`   Cause: ${err.cause}`));
        console.log(c.green(`   ✅ Fix: ${err.fix}`));
        console.log();
      });
    }

    console.log(c.bold('═'.repeat(70)));
    console.log();
  });
