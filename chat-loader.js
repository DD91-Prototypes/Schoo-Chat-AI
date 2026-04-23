/**
 * Chat Component Loader
 * Dynamically loads the chat assistant component into the page.
 */

async function loadChatComponent() {
    // Create a container if it doesn't exist
    let container = document.getElementById('chat-component-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'chat-component-container';
        
        // Find the best insertion point
        const prototypeFrame = document.querySelector('.prototype-frame');
        const pdpWrapper = document.getElementById('pdpPageWrapper');
        
        if (prototypeFrame) {
            prototypeFrame.appendChild(container);
        } else if (pdpWrapper) {
            pdpWrapper.appendChild(container);
        } else {
            document.body.appendChild(container);
        }
    }

    try {
        const response = await fetch('chat-component.html');
        if (!response.ok) throw new Error('Failed to load chat component');
        
        const html = await response.text();
        container.innerHTML = html;
        
        // Trigger a custom event when chat is ready
        document.dispatchEvent(new CustomEvent('chat-ready'));
    } catch (err) {
        console.error('Error loading chat:', err);
    }
}

// Load automatically
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadChatComponent);
} else {
    loadChatComponent();
}
