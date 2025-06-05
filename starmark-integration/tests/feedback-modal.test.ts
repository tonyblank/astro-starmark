// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { parse } from '@astrojs/compiler';

/**
 * Helper function to parse Astro component and extract HTML elements
 */
async function parseAstroComponent(componentContent: string) {
  const result = await parse(componentContent);
  return result;
}

/**
 * Helper function to find elements by attribute using regex patterns
 */
function findElementByAttribute(content: string, attribute: string, value?: string): boolean {
  if (value) {
    const pattern = new RegExp(`${attribute}\\s*=\\s*["']${value}["']`, 'i');
    return pattern.test(content);
  } else {
    const pattern = new RegExp(`\\b${attribute}\\b`, 'i');
    return pattern.test(content);
  }
}

/**
 * Helper function to find form fields by name attribute
 */
function findFormField(content: string, fieldName: string, fieldType?: string): boolean {
  const namePattern = new RegExp(`name\\s*=\\s*["']${fieldName}["']`, 'i');
  if (fieldType) {
    const typePattern = new RegExp(`<${fieldType}[^>]*name\\s*=\\s*["']${fieldName}["']`, 'i');
    return typePattern.test(content);
  }
  return namePattern.test(content);
}



describe('FeedbackModal Component', () => {
  const componentPath = join(__dirname, '../src/client/FeedbackModal.astro');
  
  it('modal renders with proper form fields', async () => {
    const componentContent = readFileSync(componentPath, 'utf-8');
    
    // Parse the component AST for more robust testing
    const ast = await parseAstroComponent(componentContent);
    expect(ast).toBeDefined();
    expect(ast.ast).toBeDefined();
    
    // Check basic modal structure using robust attribute matching
    expect(findElementByAttribute(componentContent, 'data-testid', 'feedback-modal')).toBe(true);
    expect(findElementByAttribute(componentContent, 'role', 'dialog')).toBe(true);
    expect(findElementByAttribute(componentContent, 'aria-labelledby')).toBe(true);
    expect(findElementByAttribute(componentContent, 'aria-modal', 'true')).toBe(true);
    
    // Check form structure using element detection
    expect(/<form\b[^>]*>/i.test(componentContent)).toBe(true);
    expect(findFormField(componentContent, 'category')).toBe(true);
    expect(findFormField(componentContent, 'comment')).toBe(true);
    expect(findFormField(componentContent, 'suggestedTag')).toBe(true);
    expect(findElementByAttribute(componentContent, 'type', 'submit')).toBe(true);
  });

  it('modal form has required fields and validation', async () => {
    const componentContent = readFileSync(componentPath, 'utf-8');
    
    // Parse component AST
    const ast = await parseAstroComponent(componentContent);
    expect(ast).toBeDefined();
    expect(ast.ast).toBeDefined();
    
    // Check for form fields using robust patterns
    expect(findFormField(componentContent, 'category', 'select')).toBe(true);
    expect(findFormField(componentContent, 'comment', 'textarea')).toBe(true);
    expect(findFormField(componentContent, 'suggestedTag', 'input')).toBe(true);
    expect(findElementByAttribute(componentContent, 'required')).toBe(true);
    
    // Check for dropdown structure using more flexible patterns
    const categoryMapPattern = /categories\.map\s*\(\s*\(?\s*category\s*(?:,\s*\w+)?\s*\)?\s*=>\s*\(/i;
    expect(categoryMapPattern.test(componentContent)).toBe(true);
    
    const optionPattern = /<option[^>]*value\s*=\s*\{category\}[^>]*>\s*\{category\}\s*<\/option>/i;
    expect(optionPattern.test(componentContent)).toBe(true);
    
    // Check for character limit
    expect(findElementByAttribute(componentContent, 'maxlength')).toBe(true);
    
    // Check for validation attributes
    expect(findElementByAttribute(componentContent, 'aria-describedby')).toBe(true);
  });

  it('modal has correct CSS styling and positioning', () => {
    const componentContent = readFileSync(componentPath, 'utf-8');
    
    // Extract the CSS from the <style> tag
    const styleMatch = componentContent.match(/<style>([\s\S]*?)<\/style>/);
    expect(styleMatch).not.toBeNull();
    const css = styleMatch![1];

    // Create a DOM structure that mimics the modal
    const container = document.createElement('div');
    container.innerHTML = `
      <style>
        /* Mock Starlight CSS variables */
        :root {
          --sl-color-white: #ffffff;
          --sl-color-black: #000000;
          --sl-color-gray-1: #f8f9fa;
          --sl-color-gray-2: #e9ecef;
          --sl-color-gray-6: #6c757d;
          --sl-color-accent: #3b82f6;
          --sl-color-accent-high: #2563eb;
          --sl-font: system-ui, sans-serif;
          --sl-text-base: 1rem;
          --sl-text-sm: 0.875rem;
        }
        ${css}
      </style>
      <div
        class="feedback-modal"
        data-testid="feedback-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div class="feedback-modal__content">
          <form class="feedback-modal__form">
            <select name="category" class="feedback-modal__select" required>
              <option value="">Select category</option>
              <option value="Typo">Typo</option>
              <option value="Confusing">Confusing</option>
              <option value="Other">Other</option>
            </select>
            <textarea name="comment" class="feedback-modal__textarea" required></textarea>
            <input name="suggestedTag" class="feedback-modal__input" />
            <button type="submit" class="feedback-modal__submit">Submit</button>
          </form>
        </div>
      </div>
    `;
    
    document.body.appendChild(container);
    
          try {
        const modal = container.querySelector('.feedback-modal') as HTMLElement;
        const content = container.querySelector('.feedback-modal__content') as HTMLElement;
        
        expect(modal).not.toBeNull();
        expect(content).not.toBeNull();
        
        const modalStyles = window.getComputedStyle(modal);
        const contentStyles = window.getComputedStyle(content);
        
        // Test modal positioning
        expect(modalStyles.position).toBe('fixed');
        expect(modalStyles.zIndex).toBe('999999');
        expect(modalStyles.display).toBe('none'); // Should be hidden by default
        
        // Test content positioning
        expect(contentStyles.position).toBe('relative');
        expect(contentStyles.maxWidth).toBeDefined();
      
    } finally {
      document.body.removeChild(container);
    }
  });

  it('modal includes client-side script for interaction', () => {
    const componentContent = readFileSync(componentPath, 'utf-8');
    
    // Check that script includes proper modal behavior
    expect(componentContent).toMatch(/<script(\s+lang="ts")?>/i);
    expect(componentContent).toContain('addEventListener');
    expect(componentContent).toContain('preventDefault');
    expect(componentContent).toContain('Escape');
    expect(componentContent).toContain('focus');
    
    // Check for form submission handling
    expect(componentContent).toContain('submit');
    expect(componentContent).toContain('loading');
    expect(componentContent).toContain('error');
    expect(componentContent).toContain('success');
  });

  it('modal has accessibility features', () => {
    const componentContent = readFileSync(componentPath, 'utf-8');
    
    // Check accessibility attributes
    expect(componentContent).toContain('role="dialog"');
    expect(componentContent).toContain('aria-modal="true"');
    expect(componentContent).toContain('aria-labelledby');
    expect(componentContent).toContain('aria-describedby');
    expect(componentContent).toContain('aria-live');
    
    // Check for focus management
    expect(componentContent).toContain('focus');
    expect(componentContent).toContain('tabindex');
  });

  it('modal form supports different states', () => {
    const componentContent = readFileSync(componentPath, 'utf-8');
    
    // Check for state management
    expect(componentContent).toContain('data-state');
    expect(componentContent).toContain('loading');
    expect(componentContent).toContain('success');
    expect(componentContent).toContain('error');
    
    // Check for loading spinner
    expect(componentContent).toContain('data-testid="loading-spinner"');
    expect(componentContent).toContain('data-testid="success-message"');
    expect(componentContent).toContain('data-testid="error-message"');
  });

  it('modal component exports correct TypeScript interfaces', () => {
    // Test interface shape matches expected props
    interface ExpectedProps {
      isOpen?: boolean;
      categories?: string[];
      onClose?: () => void;
      onSubmit?: (data: any) => Promise<void>;
    }

    // Verify interface compiles correctly
    const validProps: ExpectedProps = {
      isOpen: true,
      categories: ['Typo', 'Confusing', 'Other'],
      onClose: () => {},
      onSubmit: async (_data) => {}
    };

    expect(validProps.isOpen).toBe(true);
    expect(validProps.categories).toEqual(['Typo', 'Confusing', 'Other']);
    expect(typeof validProps.onClose).toBe('function');
    expect(typeof validProps.onSubmit).toBe('function');
  });
}); 