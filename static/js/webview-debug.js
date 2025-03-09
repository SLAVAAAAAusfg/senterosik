// WebView Debug Script for SenterosAI

document.addEventListener('DOMContentLoaded', function() {
    console.log('WebView Debug Script loaded successfully');
    
    // Create a floating debug console that will be visible in the WebView
    const debugConsole = document.createElement('div');
    debugConsole.id = 'webview-debug-console';
    debugConsole.style.position = 'fixed';
    debugConsole.style.bottom = '10px';
    debugConsole.style.left = '10px';
    debugConsole.style.width = '80%';
    debugConsole.style.maxHeight = '200px';
    debugConsole.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    debugConsole.style.color = '#00ff00';
    debugConsole.style.padding = '10px';
    debugConsole.style.borderRadius = '5px';
    debugConsole.style.zIndex = '10000';
    debugConsole.style.fontSize = '12px';
    debugConsole.style.fontFamily = 'monospace';
    debugConsole.style.overflow = 'auto';
    debugConsole.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
    debugConsole.innerHTML = '<h3>WebView Debug Console</h3><div id="debug-log"></div>';
    document.body.appendChild(debugConsole);
    
    const debugLog = document.getElementById('debug-log');
    
    // Override console methods to display in our WebView console
    const originalConsole = {
        log: console.log,
        warn: console.warn,
        error: console.error,
        info: console.info
    };
    
    function addLogEntry(type, args) {
        const entry = document.createElement('div');
        entry.className = `log-entry log-${type}`;
        
        // Convert arguments to string representation
        let message = '';
        for (let i = 0; i < args.length; i++) {
            try {
                if (typeof args[i] === 'object') {
                    message += JSON.stringify(args[i]);
                } else {
                    message += args[i];
                }
                
                if (i < args.length - 1) {
                    message += ' ';
                }
            } catch (e) {
                message += '[Object]';
            }
        }
        
        // Style based on log type
        let style = '';
        switch(type) {
            case 'error':
                style = 'color: #ff5555;';
                break;
            case 'warn':
                style = 'color: #ffff55;';
                break;
            case 'info':
                style = 'color: #5555ff;';
                break;
            default:
                style = 'color: #00ff00;';
        }
        
        entry.innerHTML = `<span style="${style}">[${type.toUpperCase()}]</span> ${message}`;
        debugLog.appendChild(entry);
        debugLog.scrollTop = debugLog.scrollHeight; // Auto-scroll to bottom
    }
    
    // Override console methods
    console.log = function() {
        addLogEntry('log', arguments);
        originalConsole.log.apply(console, arguments);
    };
    
    console.warn = function() {
        addLogEntry('warn', arguments);
        originalConsole.warn.apply(console, arguments);
    };
    
    console.error = function() {
        addLogEntry('error', arguments);
        originalConsole.error.apply(console, arguments);
    };
    
    console.info = function() {
        addLogEntry('info', arguments);
        originalConsole.info.apply(console, arguments);
    };
    
    // Capture and log all JavaScript errors
    window.addEventListener('error', function(e) {
        console.error('JavaScript Error:', e.message, 'at', e.filename, 'line', e.lineno, 'column', e.colno);
        return false; // Don't prevent default error handling
    });
    
    // Add button click tracking without overriding existing event listeners
    const allButtons = document.querySelectorAll('button');
    allButtons.forEach(button => {
        // Use addEventListener instead of overriding onclick
        button.addEventListener('click', function(e) {
            const buttonId = button.id || 'unnamed-button';
            console.log(`Button clicked: ${buttonId}`);
            
            // Check if event propagation is working
            if (e.bubbles) {
                console.log(`Event bubbling is enabled for ${buttonId}`);
            } else {
                console.warn(`Event bubbling is disabled for ${buttonId}`);
            }
        });
    });
    
    // Add a clear button to the debug console
    const clearButton = document.createElement('button');
    clearButton.textContent = 'Clear Console';
    clearButton.style.position = 'absolute';
    clearButton.style.top = '10px';
    clearButton.style.right = '10px';
    clearButton.style.padding = '3px 8px';
    clearButton.style.backgroundColor = '#333';
    clearButton.style.color = '#fff';
    clearButton.style.border = '1px solid #555';
    clearButton.style.borderRadius = '3px';
    clearButton.style.cursor = 'pointer';
    
    clearButton.addEventListener('click', function() {
        debugLog.innerHTML = '';
    });
    
    debugConsole.querySelector('h3').appendChild(clearButton);
    
    // Log initial page load complete
    console.info('WebView debug console initialized');
});