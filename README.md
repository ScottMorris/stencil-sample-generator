# stencil-sample-generator

Automated HTML sample generation for Stencil components using `newSpecPage()`.

## Setup

Install dependencies:

```bash
npm install
```

## Define samples

Edit `scripts/sample-config.ts` to add each component you want rendered. Each entry
accepts a component tag, the HTML snippet to render, an output filename, and an
optional description used in the generated page. The runtime script reads
`scripts/sample-config.js`, so keep both files in sync when adding new samples.

## Generate HTML samples

Run the generator to produce HTML documents under `docs/samples/`:

```bash
npm run generate-samples
```

The script first runs the Stencil build (using components generated via
`stencil generate` in `src/components/`), then renders each sample with
`newSpecPage()`, strips Stencil hydration artifacts, wraps the result in a
simple documentation shell, and writes the output file. Shadow DOM output is
preserved by translating the Stencil test harness' `<mock:shadow-root>` into a
`<template shadowroot="open">` element for readability in docs.


Automated HTML sample generation for Stencil components using `newSpecPage()`.

## Setup

Install dependencies:

```bash
npm install
```

## Define samples

Edit `scripts/sample-config.ts` to add each component you want rendered. Each entry
accepts a component tag, the HTML snippet to render, an output filename, and an
optional description used in the generated page. The runtime script reads
`scripts/sample-config.js`, so keep both files in sync when adding new samples.

## Generate HTML samples

Run the generator to produce HTML documents under `docs/samples/`:

```bash
npm run generate-samples
```

The script first runs the Stencil build (using components generated via
`stencil generate` in `src/components/`), then renders each sample with
`newSpecPage()`, strips Stencil hydration artifacts, wraps the result in a
simple documentation shell, and writes the output file. Shadow DOM output is
preserved by translating the Stencil test harness' `<mock:shadow-root>` into a
`<template shadowroot="open">` element for readability in docs.

## Sample button screenshot

Run the capture script to refresh the sample button screenshot and save it in
`docs/samples/sample-button.png` (generated locally and not tracked in git):

```bash
npm run screenshot:sample-button
```

The resulting image will be written to `docs/samples/sample-button.png` so you
can preview it locally or add it to downstream documentation.
