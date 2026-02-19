import type { Spec } from '@json-render/core';

export interface TsxComponent {
  name: string;
  props: Record<string, unknown>;
  children: TsxComponent[];
}

/**
 * Convert a JSON spec to TSX code string
 */
export function jsonToTsx(spec: Spec, options: { componentName?: string } = {}): string {
  const componentName = options.componentName || 'GeneratedComponent';
  
  const imports = new Set<string>(['React']);
  const componentCodes: string[] = [];
  
  function processElement(elementId: string, depth = 0): string {
    const element = spec.elements[elementId];
    if (!element) return '';
    
    const { type, props, children } = element;
    const indent = '  '.repeat(depth);
    
    // Build props string
    const propsStr = props 
      ? Object.entries(props)
          .map(([key, value]) => {
            if (typeof value === 'string') {
              return `${key}="${value}"`;
            }
            return `${key}={${JSON.stringify(value)}}`;
          })
          .join(' ')
      : '';
    
    // Process children
    const childrenStr = children?.length 
      ? children.map((childId: string) => processElement(childId, depth + 1)).join('\n')
      : '';
    
    if (childrenStr) {
      return `${indent}<${type} ${propsStr}>\n${childrenStr}\n${indent}</${type}>`;
    }
    
    return `${indent}<${type} ${propsStr} />`;
  }
  
  const rootCode = processElement(spec.root, 1);
  
  return `import React from 'react';

export function ${componentName}() {
  return (
${rootCode}
  );
}
`;
}

/**
 * Convert spec to a component object tree
 */
export function specToComponent(spec: Spec): TsxComponent | null {
  function buildTree(elementId: string): TsxComponent | null {
    const element = spec.elements[elementId];
    if (!element) return null;
    
    return {
      name: element.type,
      props: element.props || {},
      children: element.children?.map(buildTree).filter((c): c is TsxComponent => c !== null) || [],
    };
  }
  
  return buildTree(spec.root);
}
