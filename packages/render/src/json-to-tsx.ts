import type { Spec } from '@json-render/core';

export interface TsxComponent {
  name: string;
  props: Record<string, unknown>;
  children: TsxComponent[];
}

export interface JsonToTsxOptions {
  componentName?: string;
  componentsImportPath?: string;
}

const IDENTIFIER_REGEX = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
const INTRINSIC_TAG_REGEX = /^[a-z][a-z0-9-]*$/;
const COMPONENT_TAG_REGEX = /^[A-Z][A-Za-z0-9_]*$/;

function assertValidIdentifier(value: string, label: string): void {
  if (!IDENTIFIER_REGEX.test(value)) {
    throw new Error(`Invalid ${label}: "${value}"`);
  }
}

function formatProps(props: Record<string, unknown> | undefined): string {
  if (!props || Object.keys(props).length === 0) {
    return '';
  }
  return ` {...${JSON.stringify(props)}}`;
}

function validateElementType(type: string): void {
  if (INTRINSIC_TAG_REGEX.test(type)) {
    return;
  }
  if (COMPONENT_TAG_REGEX.test(type)) {
    return;
  }
  throw new Error(
    `Unsupported element type "${type}". Use intrinsic tags (div) or valid component names (Button).`,
  );
}

/**
 * Convert a JSON spec to TSX code string
 */
export function jsonToTsx(spec: Spec, options: JsonToTsxOptions = {}): string {
  const componentName = options.componentName ?? 'GeneratedComponent';
  const componentsImportPath = options.componentsImportPath ?? './components';
  assertValidIdentifier(componentName, 'componentName');

  const componentImports = new Set<string>();

  function processElement(elementId: string, depth = 0, stack = new Set<string>()): string {
    if (stack.has(elementId)) {
      throw new Error(`Circular element reference detected at "${elementId}"`);
    }

    const element = spec.elements[elementId];
    if (!element) {
      throw new Error(`Element "${elementId}" not found in spec.elements`);
    }

    stack.add(elementId);

    const { type, props, children } = element;
    validateElementType(type);

    if (COMPONENT_TAG_REGEX.test(type)) {
      componentImports.add(type);
    }

    const indent = '  '.repeat(depth);
    const propsStr = formatProps(props);
    const childrenStr = children?.length
      ? children.map((childId: string) => processElement(childId, depth + 1, stack)).join('\n')
      : '';

    stack.delete(elementId);

    if (childrenStr) {
      return `${indent}<${type}${propsStr}>\n${childrenStr}\n${indent}</${type}>`;
    }

    return `${indent}<${type}${propsStr} />`;
  }

  const rootCode = processElement(spec.root, 1);

  const importLines = ["import React from 'react';"];
  if (componentImports.size > 0) {
    const names = Array.from(componentImports).sort().join(', ');
    importLines.push(`import { ${names} } from '${componentsImportPath}';`);
  }

  return `${importLines.join('\n')}

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
  function buildTree(elementId: string, stack = new Set<string>()): TsxComponent | null {
    if (stack.has(elementId)) {
      throw new Error(`Circular element reference detected at "${elementId}"`);
    }

    const element = spec.elements[elementId];
    if (!element) return null;

    stack.add(elementId);
    const node: TsxComponent = {
      name: element.type,
      props: element.props || {},
      children:
        element.children?.map((childId) => buildTree(childId, stack)).filter((c): c is TsxComponent => c !== null) ||
        [],
    };
    stack.delete(elementId);
    return node;
  }

  return buildTree(spec.root);
}
