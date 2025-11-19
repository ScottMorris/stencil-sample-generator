import { newSpecPage } from '@stencil/core/testing';
import { mkdirSync, writeFileSync } from 'fs';
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
};

async function loadComponent(tagName: string): Promise<any> {
  const modulePath = componentModulePaths[tagName];
  if (!modulePath) {
    throw new Error(`No component module configured for tag: ${tagName}`);
  }

  const moduleUrl = pathToFileURL(modulePath).href;
  const module = await import(moduleUrl);
  const component = module.my_component ?? module.sample_button ?? module.default;

  if (!component) {
    throw new Error(`Unable to resolve component export for tag: ${tagName}`);
  }

  attachMetadata(tagName, component);
  return component;
}

function attachMetadata(tagName: string, component: any) {
  if (component.COMPILER_META) {
    return;
  }

  const metadata = {
    tagName,
    encapsulation: 'shadow',
    hasShadowDom: true,
    shadowDelegatesFocus: false,
    htmlTagNames: ['div', 'p', 'button', 'slot'],
    hasRenderFn: true,
    hasMode: false,
    hasModernPropertyDecls: true,
    properties:
      tagName === 'my-component'
        ? [
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
          ]
        : [
            {
              name: 'type',
              type: 1,
              mutable: false,
              reflect: false,
              attr: 'type',
              state: false,
              connected: false,
              complexType: { original: "ButtonVariant", resolved: '"primary" | "secondary"', references: {} },
            },
          ],
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

function normalizeShadowRoot(markup: string): string {
  return markup
    .replace(/<mock:shadow-root\b([^>]*)>/g, (_match, attrs: string) => {
      const mode = /mode="(.*?)"/i.exec(attrs)?.[1] ?? 'open';
      const delegatesFocus = /delegatesfocus="true"/i.test(attrs);
      const delegatesAttr = delegatesFocus ? ' shadowrootdelegatesfocus="true"' : '';

      return `<template shadowroot="${mode}"${delegatesAttr}>`;
    })
    .replace(/<\/mock:shadow-root>/g, '</template>')
    .replace(/shadowrootmode=/gi, 'shadowroot=');
}

function buildDocument(sample: ComponentSample, markup: string): string {
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
  const cleanedMarkup = stripHydrationArtifacts(normalizeShadowRoot(renderedMarkup));

  return buildDocument(sample, cleanedMarkup);
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
