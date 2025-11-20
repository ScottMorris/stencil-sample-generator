import { newSpecPage } from '@stencil/core/testing';
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { BUILD } from '@stencil/core/internal/app-data';
type ComponentSample = {
  component: string;
  html: string;
  outputFile: string;
  description?: string;
};

import { samples } from './sample-config.js';

// Ensure the mocked Stencil runtime does not expect lazy loading or asynchronous queues.
BUILD.lazyLoad = false;
BUILD.asyncLoading = false;
BUILD.taskQueue = false;

const componentModulePaths: Record<string, string> = {
  'my-component': path.join(process.cwd(), 'dist', 'stencilsample', 'my-component.entry.js'),
  'sample-button': path.join(process.cwd(), 'dist', 'stencilsample', 'sample-button.entry.js'),
  'sample-input': path.join(process.cwd(), 'dist', 'stencilsample', 'sample-input.entry.js'),
};

const componentStylePaths: Record<string, string> = {
  'my-component': path.join(process.cwd(), 'src', 'components', 'my-component', 'my-component.css'),
  'sample-button': path.join(process.cwd(), 'src', 'components', 'sample-button', 'sample-button.css'),
  'sample-input': path.join(process.cwd(), 'src', 'components', 'sample-input', 'sample-input.css'),
};

async function loadComponent(tagName: string): Promise<any> {
  const modulePath = componentModulePaths[tagName];
  if (!modulePath) {
    throw new Error(`No component module configured for tag: ${tagName}`);
  }

  const moduleUrl = pathToFileURL(modulePath).href;
  const module = await import(moduleUrl);
  const component = module.my_component ?? module.sample_button ?? module.sample_input ?? module.default;

  if (!component) {
    throw new Error(`Unable to resolve component export for tag: ${tagName}`);
  }

  attachMetadata(tagName, component);
  return component;
}

const metadataByTag: Record<string, any> = {
  'my-component': createMetadata('my-component', ['div', 'p'], [
    {
      name: 'prop',
      type: 1,
      mutable: false,
      reflect: false,
      attr: 'prop',
      state: false,
      connected: false,
      complexType: { original: 'string', resolved: 'string', references: {} },
    },
  ]),
  'sample-button': createMetadata('sample-button', ['button', 'slot'], [
    {
      name: 'type',
      type: 1,
      mutable: false,
      reflect: false,
      attr: 'type',
      state: false,
      connected: false,
      complexType: { original: 'ButtonVariant', resolved: '"primary" | "secondary"', references: {} },
    },
  ]),
  'sample-input': createMetadata('sample-input', ['label', 'span', 'input'], [
    {
      name: 'label',
      type: 1,
      mutable: false,
      reflect: false,
      attr: 'label',
      state: false,
      connected: false,
      complexType: { original: 'string', resolved: 'string', references: {} },
    },
    {
      name: 'placeholder',
      type: 1,
      mutable: false,
      reflect: false,
      attr: 'placeholder',
      state: false,
      connected: false,
      complexType: { original: 'string', resolved: 'string', references: {} },
    },
  ]),
};

function createMetadata(tagName: string, htmlTagNames: string[], properties: any[]) {
  return {
    tagName,
    encapsulation: 'shadow',
    hasShadowDom: true,
    shadowDelegatesFocus: false,
    htmlTagNames,
    hasRenderFn: true,
    hasMode: false,
    hasModernPropertyDecls: true,
    properties,
    states: [],
    listeners: [],
    watchers: [],
    methods: [],
    elementRef: undefined,
    events: [],
    connectMembers: [],
    contextMembers: [],
    legacyConnectProperties: [],
    legacyContextProperties: [],
    styles: [],
    formAssociated: false,
  } as const;
}

function attachMetadata(tagName: string, component: any) {
  if (component.COMPILER_META) {
    return;
  }

  const metadata = metadataByTag[tagName];
  if (!metadata) {
    throw new Error(`No metadata configured for tag: ${tagName}`);
  }

  component.COMPILER_META = metadata;
}

function stripHydrationArtifacts(markup: string): string {
  let cleaned = markup.replace(/\sdata-[^=\s]+="[^"]*"/g, '');

  cleaned = cleaned.replace(/\sclass="([^"]*)"/g, (_match, classValue: string) => {
    const filtered = classValue
      .split(/\s+/)
      .filter((name) => name && name !== 'hydrated');

    return filtered.length ? ` class="${filtered.join(' ')}"` : '';
  });

  return cleaned.replace(/\s+>/g, '>');
}

function flattenShadowRoot(markup: string): string {
  return markup
    .replace(/<mock:shadow-root\b[^>]*>/g, '')
    .replace(/<\/mock:shadow-root>/g, '')
    .replace(/<template\b[^>]*shadowroot[^>]*>/gi, '')
    .replace(/<\/template>/gi, '');
}

function extractSlotContent(sampleHtml: string): string | null {
  const match = sampleHtml.match(/^[^>]*>([\s\S]*?)<\/[^>]+>\s*$/);
  return match ? match[1].trim() : null;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function resolveSlots(markup: string, sample: ComponentSample): string {
  const slotContent = extractSlotContent(sample.html);
  if (!slotContent) {
    return markup;
  }

  const withSlotReplaced = markup.replace(/<slot\b[^>]*><\/slot>/g, slotContent);

  const trailingLightDomPattern = new RegExp(`${escapeRegex(slotContent)}\\s*</${sample.component}>`, 'i');
  return withSlotReplaced.replace(trailingLightDomPattern, `</${sample.component}>`);
}

function transformHostSelectors(css: string, tagName: string): string {
  return css.replace(/:host\b/g, tagName);
}

function loadComponentStyles(tagName: string): string {
  const cssPath = componentStylePaths[tagName];
  if (!cssPath) {
    return '';
  }

  try {
    const css = readFileSync(cssPath, 'utf8');
    return transformHostSelectors(css, tagName);
  } catch (error) {
    console.warn(`Warning: unable to read styles for ${tagName} at ${cssPath}:`, error);
    return '';
  }
}

function buildDocument(sample: ComponentSample, markup: string, componentCss: string): string {
  const description = sample.description
    ? `<p class="description">${sample.description}</p>`
    : '<p class="description">Rendered HTML sample generated with Stencil.</p>';

  return [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '  <meta charset="UTF-8" />',
    `  <title>${sample.component} sample</title>`,
    '  <style>',
    '    body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; padding: 1.5rem; color: #1f2933; background-color: #f7f9fb; }',
    '    main { max-width: 720px; margin: 0 auto; background: #fff; border-radius: 0.75rem; padding: 1.5rem; box-shadow: 0 6px 18px rgba(31, 41, 51, 0.08); }',
    '    h1 { margin: 0 0 0.5rem; font-size: 1.5rem; }',
    '    .description { margin: 0 0 1rem; color: #52616b; }',
    '    .sample { border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 1rem; background: #f9fafb; }',
    componentCss,
    '  </style>',
    '</head>',
    '<body>',
    '  <main>',
    `    <h1>${sample.component}</h1>`,
    `    ${description}`,
    '    <section class="sample" aria-label="Rendered component sample">',
    `      ${markup}`,
    '    </section>',
    '  </main>',
    '</body>',
    '</html>',
  ].join('\n');
}

async function renderSample(sample: ComponentSample): Promise<string> {
  const component = await loadComponent(sample.component);

  const page = await newSpecPage({
    components: [component],
    html: sample.html,
  });

  const renderedMarkup = page.root?.outerHTML ?? page.body.innerHTML;
  const cleanedMarkup = resolveSlots(stripHydrationArtifacts(flattenShadowRoot(renderedMarkup)), sample);
  const componentCss = loadComponentStyles(sample.component);

  return buildDocument(sample, cleanedMarkup, componentCss);
}

async function generateSamples(): Promise<void> {
  const outputDir = path.resolve(process.cwd(), 'docs', 'samples');
  mkdirSync(outputDir, { recursive: true });

  for (const sample of samples) {
    console.log(`Rendering ${sample.component}...`);
    const html = await renderSample(sample);
    const outputPath = path.join(outputDir, sample.outputFile);
    writeFileSync(outputPath, `${html}\n`, 'utf8');
    console.log(`✅ Generated sample: ${sample.outputFile}`);
  }
}

generateSamples().catch((error) => {
  console.error('Failed to generate samples:', error);
  process.exitCode = 1;
});

export { generateSamples };
