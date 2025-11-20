export const samples = [
  {
    component: 'my-component',
    html: '<my-component prop="value"></my-component>',
    outputFile: 'my-component.html',
    description: 'Demonstrates how to pass props to the sample component.',
  },
  {
    component: 'sample-button',
    html: '<sample-button type="primary">Click me</sample-button>',
    outputFile: 'sample-button.html',
    description: 'Renders the primary button style with slotted text content.',
  },
  {
    component: 'sample-input',
    html: '<sample-input label="Name" placeholder="Jane Doe"></sample-input>',
    outputFile: 'sample-input.html',
    description: 'Softly-styled text input with label to mirror the sample button aesthetic.',
  },
];
