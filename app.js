// app.js — School Chat AI Prototype
document.addEventListener('chat-ready', () => {
    const fab = document.getElementById('fab-btn');
    const chatWindow = document.getElementById('chat-window');
    const chatInput = document.getElementById('chat-input');

    // --- Typewriter effect ---
    const placeholders = ["Help me find what I am looking for", "Show me what's popular"];
    let placeholderIdx = 0, charIdx = 0, isDeleting = false, typingSpeed = 100;

    function typeWriter() {
        const currentPhrase = placeholders[placeholderIdx];
        if (isDeleting) { chatInput.placeholder = currentPhrase.substring(0, charIdx - 1); charIdx--; typingSpeed = 50; }
        else { chatInput.placeholder = currentPhrase.substring(0, charIdx + 1); charIdx++; typingSpeed = 100; }
        if (!isDeleting && charIdx === currentPhrase.length) { isDeleting = true; typingSpeed = 2000; }
        else if (isDeleting && charIdx === 0) { isDeleting = false; placeholderIdx = (placeholderIdx + 1) % placeholders.length; typingSpeed = 500; }
        setTimeout(typeWriter, typingSpeed);
    }
    if (chatInput) typeWriter();

    // --- FAB Logic ---
    setTimeout(() => {
        fab.classList.add('expanded');
        setTimeout(() => fab.classList.remove('expanded'), 2500);
    }, 800);

    fab.addEventListener('click', () => chatWindow.classList.toggle('open'));
});
