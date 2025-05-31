// Claude Enter Key Fix - Swaps Enter and Shift+Enter behavior
(function() {
    'use strict';
    
    console.log('Claude Enter Key Fix loaded');
    
    function findTextArea() {
        console.log('Searching for text area...');
        
        // Look for Claude's text input area - it might be a textarea or contenteditable div
        const selectors = [
            // Modern Claude interface selectors
            'div[contenteditable="true"]',
            'textarea[placeholder*="Message"]',
            'textarea[placeholder*="message"]',
            '[contenteditable="true"]',
            'textarea[data-testid*="chat"]',
            'textarea[data-testid*="input"]',
            'textarea',
            '[role="textbox"]',
            // Try to find by common patterns
            'div[role="textbox"]',
            '[data-slate-editor="true"]',
            '.ProseMirror'
        ];
        
        for (const selector of selectors) {
            const elements = document.querySelectorAll(selector);
            console.log(`Found ${elements.length} elements for selector: ${selector}`);
            
            for (const element of elements) {
                // Check if this looks like the main chat input
                const rect = element.getBoundingClientRect();
                const isVisible = rect.width > 0 && rect.height > 0;
                const isReasonableSize = rect.width > 200 && rect.height > 20;
                
                console.log(`Element:`, element, `Rect:`, rect, `Visible:`, isVisible, `Reasonable size:`, isReasonableSize);
                
                if (isVisible && isReasonableSize) {
                    console.log('Found suitable text area:', element);
                    return element;
                }
            }
        }
        
        // Fallback: try to find any focused element that might be the input
        const focused = document.activeElement;
        if (focused && (focused.tagName === 'TEXTAREA' || focused.contentEditable === 'true')) {
            console.log('Using focused element as fallback:', focused);
            return focused;
        }
        
        console.log('No suitable text area found');
        return null;
    }
    
    function handleKeyDown(event) {
        console.log('handleKeyDown called with key:', event.key, 'shift:', event.shiftKey);
        
        // Only handle Enter key
        if (event.key !== 'Enter') {
            return;
        }
        
        console.log('Enter key detected, preventing default');
        
        // Prevent the default behavior
        event.preventDefault();
        event.stopPropagation();
        
        if (event.shiftKey) {
            console.log('Shift+Enter: attempting to submit');
            // Shift+Enter should submit (trigger the original Enter behavior)
            // Find and click the submit button
            const submitSelectors = [
                'button[data-testid*="send"]',
                'button[aria-label*="Send"]',
                'button[title*="Send"]',
                'button:has(svg)',
                '[role="button"]:has(svg)'
            ];
            
            let submitButton = null;
            for (const selector of submitSelectors) {
                submitButton = document.querySelector(selector);
                if (submitButton) break;
            }
            
            if (submitButton) {
                console.log('Found submit button, clicking it');
                submitButton.click();
            } else {
                console.log('No submit button found, using fallback');
                // Fallback: create a new Enter event without shift
                const newEvent = new KeyboardEvent('keydown', {
                    key: 'Enter',
                    code: 'Enter',
                    bubbles: true,
                    cancelable: true,
                    shiftKey: false
                });
                event.target.dispatchEvent(newEvent);
            }
        } else {
            console.log('Regular Enter: simulating Shift+Enter for newline');
            // Regular Enter should add a newline by simulating Shift+Enter
            const target = event.target;
            
            // Create a new Enter event WITH shift key to trigger ProseMirror's newline behavior
            const shiftEnterEvent = new KeyboardEvent('keydown', {
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                which: 13,
                shiftKey: true,
                bubbles: true,
                cancelable: true
            });
            
            console.log('Dispatching Shift+Enter event to trigger newline');
            target.dispatchEvent(shiftEnterEvent);
        }
    }
    
    function attachListener() {
        const textArea = findTextArea();
        if (textArea) {
            if (!textArea.hasAttribute('data-enter-fix-attached')) {
                console.log('Attaching Enter key fix to:', textArea);
                textArea.addEventListener('keydown', handleKeyDown, true);
                textArea.setAttribute('data-enter-fix-attached', 'true');
                return true;
            } else {
                console.log('Element already has listener attached');
                return false;
            }
        }
        console.log('No text area found to attach to');
        return false;
    }
    
    // Try to attach immediately
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', attachListener);
    } else {
        attachListener();
    }
    
    // Also watch for dynamic content changes (Claude interface loads dynamically)
    const observer = new MutationObserver(function(mutations) {
        let shouldCheck = false;
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                shouldCheck = true;
            }
        });
        
        if (shouldCheck) {
            setTimeout(attachListener, 100); // Small delay to let elements fully load
        }
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // Periodic check as backup
    setInterval(attachListener, 2000);
})();