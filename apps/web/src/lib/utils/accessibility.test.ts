import { createFocusTrap, getFocusableElements, isElementVisible } from '../accessibility';

describe('Accessibility Utilities', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('isElementVisible', () => {
    it('returns true for visible elements', () => {
      const div = document.createElement('div');
      div.style.width = '100px';
      div.style.height = '100px';
      document.body.appendChild(div);

      expect(isElementVisible(div)).toBe(true);
    });

    it('returns false for hidden elements', () => {
      const div = document.createElement('div');
      div.style.display = 'none';
      document.body.appendChild(div);

      expect(isElementVisible(div)).toBe(false);
    });

    it('returns false for elements with zero dimensions', () => {
      const div = document.createElement('div');
      div.style.width = '0px';
      div.style.height = '0px';
      document.body.appendChild(div);

      expect(isElementVisible(div)).toBe(false);
    });

    it('returns true for elements with client rects', () => {
      const div = document.createElement('div');
      div.style.position = 'absolute';
      div.style.left = '-9999px';
      div.style.width = '100px';
      div.style.height = '100px';
      document.body.appendChild(div);

      expect(isElementVisible(div)).toBe(true);
    });
  });

  describe('getFocusableElements', () => {
    it('returns focusable elements within container', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <button>Button 1</button>
        <input type="text" />
        <a href="#">Link</a>
        <div>Not focusable</div>
        <select><option>Option</option></select>
        <textarea></textarea>
        <div tabindex="0">Focusable div</div>
        <div tabindex="-1">Not focusable</div>
      `;
      document.body.appendChild(container);

      const focusableElements = getFocusableElements(container);
      
      expect(focusableElements).toHaveLength(6);
      expect(focusableElements[0].tagName).toBe('BUTTON');
      expect(focusableElements[1].tagName).toBe('INPUT');
      expect(focusableElements[2].tagName).toBe('A');
      expect(focusableElements[3].tagName).toBe('SELECT');
      expect(focusableElements[4].tagName).toBe('TEXTAREA');
      expect(focusableElements[5].tagName).toBe('DIV');
    });

    it('filters out hidden elements', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <button>Visible button</button>
        <button style="display: none">Hidden button</button>
        <input type="text" style="visibility: hidden" />
      `;
      document.body.appendChild(container);

      const focusableElements = getFocusableElements(container);
      
      expect(focusableElements).toHaveLength(1);
      expect(focusableElements[0].textContent).toBe('Visible button');
    });
  });

  describe('createFocusTrap', () => {
    let container: HTMLElement;
    let button1: HTMLButtonElement;
    let button2: HTMLButtonElement;
    let button3: HTMLButtonElement;

    beforeEach(() => {
      container = document.createElement('div');
      container.innerHTML = `
        <button id="button1">Button 1</button>
        <button id="button2">Button 2</button>
        <button id="button3">Button 3</button>
      `;
      document.body.appendChild(container);

      button1 = document.getElementById('button1') as HTMLButtonElement;
      button2 = document.getElementById('button2') as HTMLButtonElement;
      button3 = document.getElementById('button3') as HTMLButtonElement;
    });

    it('focuses first element when created', () => {
      const cleanup = createFocusTrap(container);

      expect(document.activeElement).toBe(button1);

      cleanup();
    });

    it('cycles focus forward with Tab key', () => {
      const cleanup = createFocusTrap(container);

      // Focus first element initially
      button1.focus();
      expect(document.activeElement).toBe(button1);

      // Press Tab to go to second element
      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });
      container.dispatchEvent(tabEvent);
      expect(document.activeElement).toBe(button2);

      // Press Tab to go to third element
      container.dispatchEvent(tabEvent);
      expect(document.activeElement).toBe(button3);

      // Press Tab to cycle back to first element
      container.dispatchEvent(tabEvent);
      expect(document.activeElement).toBe(button1);

      cleanup();
    });

    it('cycles focus backward with Shift+Tab key', () => {
      const cleanup = createFocusTrap(container);

      // Focus first element initially
      button1.focus();
      expect(document.activeElement).toBe(button1);

      // Press Shift+Tab to go to last element
      const shiftTabEvent = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true });
      container.dispatchEvent(shiftTabEvent);
      expect(document.activeElement).toBe(button3);

      // Press Shift+Tab to go to second element
      container.dispatchEvent(shiftTabEvent);
      expect(document.activeElement).toBe(button2);

      // Press Shift+Tab to go to first element
      container.dispatchEvent(shiftTabEvent);
      expect(document.activeElement).toBe(button1);

      cleanup();
    });

    it('ignores non-Tab key events', () => {
      const cleanup = createFocusTrap(container);

      button1.focus();

      // Press Enter key (should be ignored)
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      container.dispatchEvent(enterEvent);
      expect(document.activeElement).toBe(button1);

      // Press Escape key (should be ignored)
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      container.dispatchEvent(escapeEvent);
      expect(document.activeElement).toBe(button1);

      cleanup();
    });

    it('removes event listener when cleanup is called', () => {
      const cleanup = createFocusTrap(container);

      button1.focus();

      // Verify event listener is working
      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });
      container.dispatchEvent(tabEvent);
      expect(document.activeElement).toBe(button2);

      // Cleanup and verify event listener is removed
      cleanup();
      
      // Reset focus
      button1.focus();
      
      // Dispatch Tab event again - should not cycle focus
      container.dispatchEvent(tabEvent);
      expect(document.activeElement).toBe(button1);
    });

    it('handles empty container gracefully', () => {
      const emptyContainer = document.createElement('div');
      document.body.appendChild(emptyContainer);

      expect(() => {
        const cleanup = createFocusTrap(emptyContainer);
        cleanup();
      }).not.toThrow();
    });

    it('handles single focusable element', () => {
      const singleContainer = document.createElement('div');
      singleContainer.innerHTML = '<button>Only button</button>';
      document.body.appendChild(singleContainer);

      const cleanup = createFocusTrap(singleContainer);
      const button = singleContainer.querySelector('button') as HTMLButtonElement;

      expect(document.activeElement).toBe(button);

      // Press Tab - should stay on the same element
      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });
      singleContainer.dispatchEvent(tabEvent);
      expect(document.activeElement).toBe(button);

      cleanup();
    });
  });
});