// Debug script for SenterosAI to identify button click issues

document.addEventListener('DOMContentLoaded', function() {
    console.log('Debug script loaded successfully');
    
    // Add visual indicator for debugging mode
    const debugIndicator = document.createElement('div');
    debugIndicator.style.position = 'fixed';
    debugIndicator.style.bottom = '10px';
    debugIndicator.style.right = '10px';
    debugIndicator.style.backgroundColor = 'rgba(255, 0, 0, 0.7)';
    debugIndicator.style.color = 'white';
    debugIndicator.style.padding = '5px 10px';
    debugIndicator.style.borderRadius = '5px';
    debugIndicator.style.zIndex = '9999';
    debugIndicator.style.fontSize = '12px';
    debugIndicator.textContent = 'Debug Mode';
    document.body.appendChild(debugIndicator);
    
    // Debug all buttons in the application
    const allButtons = document.querySelectorAll('button');
    console.log(`Found ${allButtons.length} buttons to debug`);
    
    allButtons.forEach((button, index) => {
        // Log button details
        const buttonId = button.id || 'unnamed-button';
        const buttonText = button.textContent.trim() || 'empty';
        const buttonClasses = Array.from(button.classList).join(', ') || 'none';
        
        console.log(`Button ${index + 1}: id="${buttonId}", text="${buttonText}", classes="${buttonClasses}"`);
        
        // Check for potential issues
        const computedStyle = window.getComputedStyle(button);
        const isVisible = computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden';
        const hasPointerEvents = computedStyle.pointerEvents !== 'none';
        const zIndex = computedStyle.zIndex;
        
        if (!isVisible) {
            console.warn(`Button "${buttonId}" is not visible!`);
        }
        
        if (!hasPointerEvents) {
            console.warn(`Button "${buttonId}" has pointer-events: none!`);
        }
        
        // Add debug click handler
        button.addEventListener('click', function(e) {
            console.log(`%cButton Clicked: ${buttonId}`, 'color: green; font-weight: bold;');
            console.log('Event details:', e);
        });
        
        // Add visual feedback on hover for debugging
        button.addEventListener('mouseenter', function() {
            this.dataset.originalOutline = this.style.outline;
            this.style.outline = '2px solid red';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.outline = this.dataset.originalOutline || '';
        });
    });
    
    // Debug event propagation
    document.addEventListener('click', function(e) {
        console.log('Document click event:', e.target);
        
        // Check if click target is or is inside a button
        let isButtonClick = false;
        let element = e.target;
        
        while (element && element !== document.body) {
            if (element.tagName === 'BUTTON') {
                isButtonClick = true;
                break;
            }
            element = element.parentElement;
        }
        
        if (!isButtonClick) {
            console.log('Click was not on a button');
        }
    }, true); // Use capture phase
    
    // Check for overlapping elements that might block clicks
    function checkForOverlappingElements() {
        allButtons.forEach(button => {
            const buttonRect = button.getBoundingClientRect();
            const buttonId = button.id || 'unnamed-button';
            
            // Get all elements at this position
            const elementsAtPoint = document.elementsFromPoint(
                buttonRect.left + buttonRect.width / 2,
                buttonRect.top + buttonRect.height / 2
            );
            
            // If the button is not the first element, it might be covered
            if (elementsAtPoint[0] !== button) {
                console.warn(`Button "${buttonId}" might be covered by:`, elementsAtPoint[0]);
            }
        });
    }
    
    // Run the overlap check after a short delay to ensure the page is fully rendered
    setTimeout(checkForOverlappingElements, 1000);
    
    // Monitor JavaScript errors
    window.addEventListener('error', function(e) {
        console.error('JavaScript error detected:', e.error);
    });
});