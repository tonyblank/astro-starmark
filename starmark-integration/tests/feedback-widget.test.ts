import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('FeedbackWidget Component', () => {
  it('component file exists and has correct structure', () => {
    const componentPath = join(__dirname, '../src/client/FeedbackWidget.astro');
    const componentContent = readFileSync(componentPath, 'utf-8');
    
    // Check basic component structure
    expect(componentContent).toContain('export interface Props');
    expect(componentContent).toContain('data-testid="feedback-widget"');
    expect(componentContent).toContain('aria-label="Open feedback form"');
    expect(componentContent).toContain('type="button"');
    expect(componentContent).toContain('<script>');
  });

  it('component has proper CSS positioning and theming', () => {
    const componentPath = join(__dirname, '../src/client/FeedbackWidget.astro');
    const componentContent = readFileSync(componentPath, 'utf-8');
    
    // Check CSS positioning
    expect(componentContent).toContain('position: fixed');
    expect(componentContent).toContain('z-index: 99999');
    expect(componentContent).toContain('bottom: 24px');
    expect(componentContent).toContain('right: 24px');
    
    // Check Starlight CSS variables usage
    expect(componentContent).toContain('var(--sl-color-accent)');
    expect(componentContent).toContain('var(--sl-font)');
    expect(componentContent).toContain('var(--sl-text-sm)');
  });

  it('component includes accessibility features', () => {
    const componentPath = join(__dirname, '../src/client/FeedbackWidget.astro');
    const componentContent = readFileSync(componentPath, 'utf-8');
    
    // Check ARIA attributes
    expect(componentContent).toContain('aria-label="Open feedback form"');
    expect(componentContent).toContain('aria-hidden="true"');
    
    // Check keyboard navigation
    expect(componentContent).toContain('event.key === "Enter"');
    expect(componentContent).toContain('event.key === " "');
    expect(componentContent).toContain('addEventListener');
    
    // Check semantic HTML
    expect(componentContent).toContain('type="button"');
    expect(componentContent).toContain('data-testid="feedback-widget"');
  });

  it('component has responsive design features', () => {
    const componentPath = join(__dirname, '../src/client/FeedbackWidget.astro');
    const componentContent = readFileSync(componentPath, 'utf-8');
    
    // Check responsive behavior
    expect(componentContent).toContain('@container');
    expect(componentContent).toContain('(max-width: 480px)');
    expect(componentContent).toContain('@media (prefers-reduced-motion: reduce)');
    expect(componentContent).toContain('@media print');
  });

  it('component has proper TypeScript props interface', () => {
    const componentPath = join(__dirname, '../src/client/FeedbackWidget.astro');
    const componentContent = readFileSync(componentPath, 'utf-8');
    
    // Check TypeScript interface
    expect(componentContent).toContain('export interface Props');
    expect(componentContent).toContain('categories?');
    expect(componentContent).toContain('position?');
    expect(componentContent).toContain('text?');
  });
}); 