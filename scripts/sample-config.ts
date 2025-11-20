export interface ComponentSample {
  /**
   * Component tag name used to resolve the Stencil component class.
   */
  component: string;
  /**
   * HTML snippet that represents the component in the docs.
   */
  html: string;
  /**
   * Output filename for the generated sample document.
   */
  outputFile: string;
  /**
   * Optional short description that will be included in the generated page.
   */
  description?: string;
}

export const samples: ComponentSample[] = [
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
