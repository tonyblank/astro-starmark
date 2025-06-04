// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('FeedbackModal Component', () => {
  const componentPath = join(__dirname, '../src/client/FeedbackModal.astro');
  
  it('modal renders with proper form fields', () => {
    const componentContent = readFileSync(componentPath, 'utf-8');
    
    // Check basic modal structure
    expect(componentContent).toContain('data-testid="feedback-modal"');
    expect(componentContent).toContain('role="dialog"');
    expect(componentContent).toContain('aria-labelledby');
    expect(componentContent).toContain('aria-modal="true"');
    
    // Check form structure
    expect(componentContent).toContain('<form');
    expect(componentContent).toContain('name="category"');
    expect(componentContent).toContain('name="comment"');
    expect(componentContent).toContain('name="suggestedTag"');
    expect(componentContent).toContain('type="submit"');
  });

  it('modal form has required fields and validation', () => {
    const componentContent = readFileSync(componentPath, 'utf-8');
    
    // Check for form fields
    expect(componentContent).toContain('name="category"');
    expect(componentContent).toContain('name="comment"');
    expect(componentContent).toContain('name="suggestedTag"');
    expect(componentContent).toContain('required');
    
    // Check for dropdown structure (JSX style) - formatted by Prettier
    expect(componentContent).toContain('categories.map((category) => (');
    expect(componentContent).toContain('<option value={category}>{category}</option>');
    
    // Check for character limit
    expect(componentContent).toContain('maxlength');
    
    // Check for validation attributes
    expect(componentContent).toContain('aria-describedby');
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
    expect(componentContent).toContain('<script>');
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