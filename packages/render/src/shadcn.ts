// Re-export everything from @json-render/shadcn
// This provides all 36 pre-built shadcn/ui components

import {
  shadcnComponents,
  shadcnComponentDefinitions,
  type ShadcnProps,
} from '@json-render/shadcn';

export {
  // Component implementations (36 shadcn/ui components)
  shadcnComponents,
  // Component definitions for building catalogs
  shadcnComponentDefinitions,
  // Type for component props
  ShadcnProps,
} from '@json-render/shadcn';

// Re-export from catalog subpath
export {
  shadcnComponentDefinitions as componentDefinitions,
} from '@json-render/shadcn/catalog';

// Convenience: Common component selections for agentstage apps
export const commonComponentNames = [
  'Button',
  'Card',
  'Input',
  'Stack',
  'Text',
  'Heading',
  'Badge',
  'Separator',
  'Dialog',
  'Tabs',
  'Table',
] as const;

export type CommonComponentName = typeof commonComponentNames[number];

// Helper to pick only common components from shadcnComponents
export function pickCommonComponents() {
  const { 
    Button, 
    Card, 
    Input, 
    Stack, 
    Text, 
    Heading, 
    Badge, 
    Separator, 
    Dialog, 
    Tabs, 
    Table 
  } = shadcnComponents;
  
  return {
    Button,
    Card,
    Input,
    Stack,
    Text,
    Heading,
    Badge,
    Separator,
    Dialog,
    Tabs,
    Table,
  };
}

// Helper to create a minimal catalog with just common components
export function createCommonCatalog() {
  const { 
    Button, 
    Card, 
    Input, 
    Stack, 
    Text, 
    Heading, 
    Badge, 
    Separator, 
    Dialog, 
    Tabs, 
    Table 
  } = shadcnComponentDefinitions;
  
  return {
    components: {
      Button,
      Card,
      Input,
      Stack,
      Text,
      Heading,
      Badge,
      Separator,
      Dialog,
      Tabs,
      Table,
    },
    actions: {},
  };
}
