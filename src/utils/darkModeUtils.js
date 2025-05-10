/**
 * Utility functions for dark mode
 */

// Inject dark mode styles directly into the document
export const injectDarkModeStyles = (isDarkMode) => {
  // Remove any existing injected styles
  const existingStyle = document.getElementById('dark-mode-styles');
  if (existingStyle) {
    existingStyle.remove();
  }

  if (isDarkMode) {
    // Create a style element
    const style = document.createElement('style');
    style.id = 'dark-mode-styles';
    
    // Add comprehensive dark mode styles
    style.textContent = `
      body, #root, main, section, div, header, footer, aside, nav {
        background-color: var(--bg-primary) !important;
        color: var(--text-primary) !important;
      }
      
      .bg-white, .bg-gray-50, .bg-gray-100, .bg-gray-200 {
        background-color: var(--bg-secondary) !important;
      }
      
      .text-black, .text-gray-800, .text-gray-900 {
        color: var(--text-primary) !important;
      }
      
      .text-gray-600, .text-gray-700 {
        color: var(--text-secondary) !important;
      }
      
      .border-gray-100, .border-gray-200, .border-gray-300 {
        border-color: var(--border-color) !important;
      }
      
      /* Handle cards and containers */
      .card, [class*="shadow"], [class*="rounded"] {
        background-color: var(--card-bg) !important;
        border-color: var(--border-color) !important;
      }
      
      /* Handle inputs and form elements */
      input, select, textarea, button:not([class*="bg-green"]):not([class*="bg-blue"]):not([class*="bg-red"]) {
        background-color: var(--bg-secondary) !important;
        color: var(--text-primary) !important;
        border-color: var(--border-color) !important;
      }
      
      /* Preserve accent colors */
      [class*="text-green"], [class*="text-blue"], [class*="text-red"], 
      [class*="bg-green"], [class*="bg-blue"], [class*="bg-red"] {
        /* These will keep their original colors */
      }
    `;
    
    // Append the style to the head
    document.head.appendChild(style);
  }
};

// Apply dark mode to a specific element and its children
export const applyDarkModeToElement = (element, isDarkMode) => {
  if (!element) return;
  
  if (isDarkMode) {
    // Background colors
    if (element.classList.contains('bg-white') || 
        element.classList.contains('bg-gray-50') || 
        element.classList.contains('bg-gray-100') || 
        element.classList.contains('bg-gray-200')) {
      element.dataset.originalBg = element.className;
      element.classList.remove('bg-white', 'bg-gray-50', 'bg-gray-100', 'bg-gray-200');
      element.classList.add('bg-gray-800');
    }
    
    // Text colors
    if (element.classList.contains('text-black') || 
        element.classList.contains('text-gray-800') || 
        element.classList.contains('text-gray-900') || 
        element.classList.contains('text-gray-700')) {
      element.dataset.originalText = element.className;
      element.classList.remove('text-black', 'text-gray-800', 'text-gray-900', 'text-gray-700');
      element.classList.add('text-white');
    }
    
    // Border colors
    if (element.classList.contains('border-gray-100') || 
        element.classList.contains('border-gray-200') || 
        element.classList.contains('border-gray-300')) {
      element.dataset.originalBorder = element.className;
      element.classList.remove('border-gray-100', 'border-gray-200', 'border-gray-300');
      element.classList.add('border-gray-700');
    }
  } else {
    // Restore original classes
    if (element.dataset.originalBg) {
      element.className = element.dataset.originalBg;
      delete element.dataset.originalBg;
    }
    
    if (element.dataset.originalText) {
      element.className = element.dataset.originalText;
      delete element.dataset.originalText;
    }
    
    if (element.dataset.originalBorder) {
      element.className = element.dataset.originalBorder;
      delete element.dataset.originalBorder;
    }
  }
  
  // Apply to children
  Array.from(element.children).forEach(child => {
    applyDarkModeToElement(child, isDarkMode);
  });
};