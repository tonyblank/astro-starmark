import { experimental_AstroContainer as AstroContainer, type ContainerRenderOptions } from 'astro/container';

type AstroComponentFactory = Parameters<AstroContainer['renderToString']>[0];

/**
 * Helper function to render an Astro component for testing
 * Following the latest Astro 5 Container API best practices
 * @param Component - The Astro component to render
 * @param options - Rendering options including props, slots, etc.
 * @returns DOM element that can be queried for testing
 */
export async function renderAstroComponent(
  Component: AstroComponentFactory,
  options: ContainerRenderOptions = {}
) {
  const container = await AstroContainer.create();
  const result = await container.renderToString(Component, options);

  // Create a template element and set innerHTML - best practice from latest docs
  const template = document.createElement('template');
  template.innerHTML = result;
  
  return template.content;
}

/**
 * Helper function to render an Astro component to string for testing
 * @param Component - The Astro component to render
 * @param options - Rendering options including props, slots, etc.
 * @returns HTML string
 */
export async function renderAstroComponentToString(
  Component: AstroComponentFactory,
  options: ContainerRenderOptions = {}
) {
  const container = await AstroContainer.create();
  return await container.renderToString(Component, options);
} 