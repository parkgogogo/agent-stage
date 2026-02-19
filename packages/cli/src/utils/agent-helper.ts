/**
 * Agent Error Helper - 为 Agent 提供自我修复指引
 */

import c from 'picocolors';

export interface ErrorGuide {
  message: string;
  cause: string;
  fix: string;
  example: string;
  relatedCommands: string[];
}

const errorGuides: Record<string, ErrorGuide> = {
  // 初始化相关
  'not_initialized': {
    message: 'Project not initialized',
    cause: 'This is the first time using agentstage in this environment',
    fix: 'Initialize a new project',
    example: 'agentstage init',
    relatedCommands: ['init', 'guide quickstart']
  },

  // 页面名称相关
  'invalid_page_name': {
    message: 'Page name contains invalid characters',
    cause: 'Page names can only contain lowercase letters, numbers, and hyphens',
    fix: 'Use only a-z, 0-9, and - in the name',
    example: 'agentstage page add my-page  ✅\nagentstage page add MyPage   ❌ (uppercase)\nagentstage page add my_page  ❌ (underscore)',
    relatedCommands: ['page add', 'guide page-add']
  },

  'page_already_exists': {
    message: 'Page already exists',
    cause: 'A page with this name was already created',
    fix: 'Choose a different name, or remove the existing page first',
    example: 'agentstage page add my-page-v2\n# OR\nagentstage page rm my-page --force\nagentstage page add my-page',
    relatedCommands: ['page add', 'page rm', 'page ls']
  },

  // JSON 相关
  'invalid_ui_json': {
    message: 'Invalid UI JSON format',
    cause: 'The UI JSON is malformed or missing required fields',
    fix: 'Ensure your JSON has "root" and "elements" fields',
    example: `{
  "root": "main",
  "elements": {
    "main": {
      "type": "Stack",
      "props": {},
      "children": []
    }
  }
}`,
    relatedCommands: ['guide ui-json', 'validate ui']
  },

  'invalid_state_json': {
    message: 'Invalid state JSON format',
    cause: 'The state JSON cannot be parsed',
    fix: 'Provide valid JSON object',
    example: '{"count": 0, "items": []}',
    relatedCommands: ['guide state-management']
  },

  // 运行时相关
  'runtime_not_running': {
    message: 'Runtime is not running',
    cause: 'The development server is not started',
    fix: 'Start the dev server in another terminal',
    example: 'agentstage dev start',
    relatedCommands: ['dev start', 'dev status']
  },

  'page_not_connected': {
    message: 'Page is not connected',
    cause: 'Using --live flag but page is not open in browser',
    fix: 'Either remove --live, or open the page in browser first',
    example: '# Option 1: File-only update\nagentstage run set-state mypage \'{...}\'\n\n# Option 2: Open page first\n# Then use --live',
    relatedCommands: ['run set-state', 'dev start']
  },

  // 路径遍历（安全）
  'path_traversal_detected': {
    message: 'Path traversal detected',
    cause: 'Page name or path contains ".." which is not allowed',
    fix: 'Use a simple name without directory traversal',
    example: 'agentstage page add my-page  ✅\nagentstage page add ../etc  ❌ (not allowed)',
    relatedCommands: ['page add', 'page rm']
  },

  // 组件相关
  'invalid_component_type': {
    message: 'Invalid component type',
    cause: 'The component name does not exist in json-render',
    fix: 'Use one of the available component types',
    example: 'Available: Stack, Card, Heading, Text, Button, Input, Table, Tabs, Dialog, etc.',
    relatedCommands: ['guide ui-json']
  },

  // 状态路径相关
  'invalid_state_path': {
    message: 'Invalid state path',
    cause: 'State path should start with "/"',
    fix: 'Add leading slash to state paths',
    example: '{ "$state": "/count" }  ✅\n{ "$state": "count" }   ❌',
    relatedCommands: ['guide ui-json', 'guide state-management']
  }
};

/**
 * 根据错误消息匹配对应的指引
 */
export function findErrorGuide(errorMessage: string): ErrorGuide | null {
  const normalized = errorMessage.toLowerCase();
  
  if (normalized.includes('not initialized')) return errorGuides['not_initialized'];
  if (normalized.includes('already exists')) return errorGuides['page_already_exists'];
  if (normalized.includes('invalid page name') || normalized.includes('path traversal')) return errorGuides['invalid_page_name'];
  if (normalized.includes('invalid ui json')) return errorGuides['invalid_ui_json'];
  if (normalized.includes('invalid state json')) return errorGuides['invalid_state_json'];
  if (normalized.includes('runtime is not running')) return errorGuides['runtime_not_running'];
  if (normalized.includes('not connected')) return errorGuides['page_not_connected'];
  
  return null;
}

/**
 * 输出 Agent 友好的错误指引
 */
export function printAgentErrorHelp(error: Error | string, context?: string): void {
  const message = typeof error === 'string' ? error : error.message;
  const guide = findErrorGuide(message);
  
  console.log();
  console.log(c.red('❌ ERROR'));
  console.log(c.red(message));
  console.log();
  
  if (guide) {
    console.log(c.yellow('🔍 CAUSE'));
    console.log(c.gray(guide.cause));
    console.log();
    
    console.log(c.green('✅ FIX'));
    console.log(guide.fix);
    console.log();
    
    console.log(c.cyan('💡 EXAMPLE'));
    console.log(guide.example);
    console.log();
    
    if (guide.relatedCommands.length > 0) {
      console.log(c.dim('📚 Related:'));
      guide.relatedCommands.forEach(cmd => {
        console.log(c.dim(`   agentstage ${cmd}`));
      });
      console.log();
    }
  } else {
    // 通用指引
    console.log(c.yellow('💡 Need help?'));
    console.log(c.dim('   agentstage guide --list      List all topics'));
    console.log(c.dim('   agentstage guide quickstart  Get started guide'));
    console.log();
  }
  
  if (context) {
    console.log(c.gray(`Context: ${context}`));
    console.log();
  }
}

/**
 * 输出成功案例指引
 */
export function printAgentSuccess(message: string, nextSteps?: string[]): void {
  console.log();
  console.log(c.green('✅ SUCCESS'));
  console.log(message);
  console.log();
  
  if (nextSteps && nextSteps.length > 0) {
    console.log(c.cyan('➡️  NEXT STEPS'));
    nextSteps.forEach((step, i) => {
      console.log(c.gray(`   ${i + 1}. ${step}`));
    });
    console.log();
  }
}

/**
 * 输出 Agent 可用的提示
 */
export function printAgentHint(message: string): void {
  console.log(c.dim(`💡 ${message}`));
}

/**
 * 输出 Agent 警告
 */
export function printAgentWarning(message: string): void {
  console.log(c.yellow(`⚠️  ${message}`));
}
