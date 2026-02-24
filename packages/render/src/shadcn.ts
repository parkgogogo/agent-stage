import {
  shadcnComponents,
  shadcnComponentDefinitions,
  type ShadcnProps,
} from '@json-render/shadcn';

export {
  shadcnComponents,
  shadcnComponentDefinitions,
  ShadcnProps,
} from '@json-render/shadcn';

export {
  shadcnComponentDefinitions as componentDefinitions,
} from '@json-render/shadcn/catalog';

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
export type ShadcnComponentName = keyof typeof shadcnComponents;

export function pickShadcnComponents<TNames extends readonly ShadcnComponentName[]>(
  names: TNames,
): Pick<typeof shadcnComponents, TNames[number]> {
  const entries = names.map((name) => [name, shadcnComponents[name]] as const);
  return Object.fromEntries(entries) as Pick<typeof shadcnComponents, TNames[number]>;
}

export function pickShadcnComponentDefinitions<TNames extends readonly ShadcnComponentName[]>(
  names: TNames,
): Pick<typeof shadcnComponentDefinitions, TNames[number]> {
  const entries = names.map((name) => [name, shadcnComponentDefinitions[name]] as const);
  return Object.fromEntries(entries) as Pick<typeof shadcnComponentDefinitions, TNames[number]>;
}

export function pickCommonComponents() {
  return pickShadcnComponents(commonComponentNames);
}

export function createCommonCatalog() {
  return {
    components: pickShadcnComponentDefinitions(commonComponentNames),
    actions: {},
  };
}
