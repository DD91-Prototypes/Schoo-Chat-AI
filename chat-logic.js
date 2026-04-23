/**
 * chat-logic.js — Shared AI Assistant Logic
 * Handles conversation flow, state persistence, and product recommendations
 */
document.addEventListener('chat-ready', () => {
    const chatWindow = document.getElementById('chat-window');
    const closeChat = document.getElementById('close-chat');
    const expandChat = document.getElementById('expand-chat');
    const chatBody = document.querySelector('.chat-body');
    const meatballBtn = document.getElementById('meatball-btn');
    const meatballMenu = document.getElementById('meatball-menu');
    const clearChatBtn = document.getElementById('clear-chat');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.querySelector('.send-btn');

    // Product Modal Elements
    const productModal = document.getElementById('product-modal');
    const modalClose = document.getElementById('modal-close');
    const modalMainImg = document.getElementById('modal-main-image');
    const modalThumbnails = document.getElementById('modal-thumbnails');
    const modalTitle = document.getElementById('modal-product-title');
    const modalPrice = document.getElementById('modal-product-price');
    const modalSku = document.getElementById('modal-product-sku');
    const modalRating = document.getElementById('modal-product-rating');

    const initialChatHTML = chatBody.innerHTML;
    let productsData = [];
    let userChoices = { age: '', jumperColor: '', shirtType: '', shirtColor: '', trouserColor: '' };
    let lastGroup = null;

    // --- Core Logic ---

    // Fetch product data
    fetch('product.json')
        .then(response => response.json())
        .then(data => {
            productsData = data.products;
            restoreChatState();
        })
        .catch(err => console.error('Error loading products:', err));

    function saveChatState() {
        sessionStorage.setItem('chatHistory', chatBody.innerHTML);
        sessionStorage.setItem('userChoices', JSON.stringify(userChoices));
    }

    function restoreChatState() {
        const savedHistory = sessionStorage.getItem('chatHistory');
        const savedChoices = sessionStorage.getItem('userChoices');
        
        if (savedHistory) {
            chatBody.innerHTML = savedHistory;
            if (savedChoices) userChoices = JSON.parse(savedChoices);
            
            chatBody.scrollTop = chatBody.scrollHeight;
            
            // Re-init interactions for history
            document.querySelectorAll('.pill-scroller').forEach(initDragScroll);
            document.querySelectorAll('.product-carousel').forEach(setupCarouselNavigation);
            
            // Re-attach product card listeners (for redirects)
            document.querySelectorAll('.product-card').forEach(card => {
                card.onclick = () => {
                    const pid = card.getAttribute('data-product-id');
                    const ageParam = userChoices.age ? `&age=${encodeURIComponent(userChoices.age)}` : '';
                    window.location.href = `pdp-template.html?id=${pid}${ageParam}`;
                };
            });
        } else {
            initConversations();
        }
    }

    function initConversations() {
        userChoices = { age: '', jumperColor: '', shirtType: '', shirtColor: '', trouserColor: '' };
        const initialGroup = chatBody.querySelector('.interaction-group');
        lastGroup = initialGroup;
        
        const pillYes = document.getElementById('pill-yes');
        const pillNo = document.getElementById('pill-no');
        const initialOptions = document.getElementById('initial-options');
        
        if (initialOptions) initDragScroll(initialOptions);

        if (pillYes) {
            pillYes.onclick = () => {
                if (initialOptions.classList.contains('locked')) return;
                initialOptions.classList.add('locked');
                pillYes.classList.add('selected');
                addUserMessage('Yes');
                showTyping();
                setTimeout(() => {
                    hideTyping();
                    addBotMessage('How old is your child?');
                    addAgeOptions();
                }, 1500);
            };
        }
    }

    // --- Window Controls ---
    if (closeChat) {
        closeChat.onclick = (e) => {
            e.stopPropagation();
            chatWindow.classList.remove('open');
        };
    }

    if (expandChat) {
        expandChat.onclick = (e) => {
            e.stopPropagation();
            chatWindow.classList.toggle('maximized');
            setTimeout(updateAllCarousels, 400);
        };
    }

    if (meatballBtn) {
        meatballBtn.onclick = (e) => {
            e.stopPropagation();
            meatballMenu.classList.toggle('show');
        };
        document.addEventListener('click', () => meatballMenu.classList.remove('show'));
    }

    if (clearChatBtn) {
        clearChatBtn.onclick = (e) => {
            e.stopPropagation();
            chatBody.innerHTML = initialChatHTML;
            meatballMenu.classList.remove('show');
            sessionStorage.removeItem('chatHistory');
            sessionStorage.removeItem('userChoices');
            initConversations();
        };
    }

    // Modal Close
    if (modalClose) {
        modalClose.onclick = () => {
            productModal.classList.remove('show');
            setTimeout(() => { productModal.style.display = 'none'; }, 300);
        };
    }

    // --- UI Helpers ---

    function showTyping() {
        if (document.querySelector('.typing-indicator')) return;
        const loader = document.createElement('div');
        loader.className = 'typing-indicator';
        loader.innerHTML = '<div class="dot"></div><div class="dot"></div><div class="dot"></div>';
        chatBody.appendChild(loader);
        chatBody.scrollTop = chatBody.scrollHeight;
        saveChatState();
    }

    function hideTyping() {
        const loaders = document.querySelectorAll('.typing-indicator');
        loaders.forEach(l => l.remove());
        saveChatState();
    }

    function addBotMessage(text) {
        const group = document.createElement('div');
        group.className = 'interaction-group';
        group.innerHTML = `
            <div class="message bot-message">
                <div class="bot-icon-small"><img src="images/ai-logo.svg" alt="" /></div>
                <div class="message-bubble">${text}</div>
            </div>
        `;
        chatBody.appendChild(group);
        lastGroup = group;
        chatBody.scrollTop = chatBody.scrollHeight;
        saveChatState();
    }

    function addUserMessage(text) {
        lastGroup = null;
        const userMsg = document.createElement('div');
        userMsg.className = 'user-msg-container';
        userMsg.innerHTML = `<div class="user-bubble">${text}</div>`;
        chatBody.appendChild(userMsg);
        chatBody.scrollTop = chatBody.scrollHeight;
        saveChatState();
    }

    function addOptions(options, onSelect) {
        const scroller = document.createElement('div');
        scroller.className = 'pill-scroller';
        options.forEach(optionText => {
            const pill = document.createElement('button');
            pill.className = 'pill';
            pill.innerText = optionText;
            pill.onclick = () => {
                if (scroller.classList.contains('locked')) return;
                scroller.classList.add('locked');
                pill.classList.add('selected');
                addUserMessage(optionText);
                if (onSelect) onSelect(optionText);
            };
            scroller.appendChild(pill);
        });
        if (lastGroup) lastGroup.appendChild(scroller);
        else chatBody.appendChild(scroller);
        initDragScroll(scroller);
        chatBody.scrollTop = chatBody.scrollHeight;
        saveChatState();
    }

    // --- Conversation Steps ---
    function addAgeOptions() {
        const options = [];
        for (let age = 3; age <= 16; age++) options.push(`${age} yrs`);
        addOptions(options, (val) => {
            userChoices.age = val;
            showTyping();
            setTimeout(() => {
                hideTyping();
                addBotMessage('What colour Jumper do you require?');
                addColorOptions();
            }, 1500);
        });
    }

    function addColorOptions() {
        const colors = ['Navy Blue', 'Blue', 'Green', 'Grey', 'Black', 'Red', 'Not required'];
        addOptions(colors, (val) => {
            userChoices.jumperColor = val;
            showTyping();
            setTimeout(() => {
                hideTyping();
                addBotMessage('Do you require Shirts or Polo Shirts?');
                addShirtOptions();
            }, 1500);
        });
    }

    function addShirtOptions() {
        const shirts = ['Long Sleeved Shirt', 'Short Sleeved Shirt', 'Polo Shirt', 'Not required'];
        addOptions(shirts, (val) => {
            userChoices.shirtType = val;
            showTyping();
            setTimeout(() => {
                hideTyping();
                if (val === 'Not required') {
                    handleShirtOptionSelection('Not required');
                } else {
                    addBotMessage(`What colour ${val} do you require?`);
                    addOptions(['White', 'Blue', 'Green', 'Yellow'], handleShirtOptionSelection);
                }
            }, 1500);
        });
    }

    function handleShirtOptionSelection(val) {
        userChoices.shirtColor = val;
        showTyping();
        setTimeout(() => {
            hideTyping();
            addBotMessage('What colour Trousers do you require?');
            addTrouserOptions();
        }, 1500);
    }

    function addTrouserOptions() {
        const colors = ['Black', 'Grey', 'Navy Blue', 'Not required'];
        addOptions(colors, (val) => {
            userChoices.trouserColor = val;
            showTyping();
            setTimeout(() => {
                hideTyping();
                triggerFinalRecommendations();
            }, 2000);
        });
    }

    function triggerFinalRecommendations() {
        showTyping();
        setTimeout(() => {
            hideTyping();
            let delay = 0;
            if (userChoices.jumperColor !== 'Not required') {
                setTimeout(() => addRecommendedProducts(`Here are some ${userChoices.jumperColor} Jumper options:`, 'Jumper', userChoices.jumperColor), delay);
                delay += 1000;
            }
            if (userChoices.shirtColor !== 'Not required' && userChoices.shirtType !== 'Not required') {
                setTimeout(() => {
                    showTyping();
                    setTimeout(() => {
                        hideTyping();
                        addRecommendedProducts(`Here are some ${userChoices.shirtColor} ${userChoices.shirtType} options:`, userChoices.shirtType, userChoices.shirtColor);
                    }, 500);
                }, delay);
                delay += 1500;
            }
            if (userChoices.trouserColor !== 'Not required') {
                setTimeout(() => {
                    showTyping();
                    setTimeout(() => {
                        hideTyping();
                        addRecommendedProducts(`Here are some ${userChoices.trouserColor} Trousers options:`, 'Trousers', userChoices.trouserColor);
                    }, 500);
                }, delay);
            }
        }, 1000);
    }

    function addRecommendedProducts(title, category, color) {
        const group = document.createElement('div');
        group.className = 'interaction-group';
        const recSection = document.createElement('div');
        recSection.className = 'product-recommendations';

        const matchingProducts = getProductsByCategoryAndColor(category, color);

        recSection.innerHTML = `
            <div class="recommendation-header">
                <img src="images/ai-logo.svg" alt="" class="ai-logo-small" /><p>${title}</p>
            </div>
            <div class="product-carousel-wrapper">
                <button class="carousel-nav-btn nav-prev" title="Previous"><svg viewBox="0 0 24 24" fill="none"><path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
                <div class="product-carousel">
                    ${matchingProducts.length > 0 
                        ? matchingProducts.map(p => renderProductCard(p)).join('')
                        : `<div class="product-card"><div class="product-info"><div class="product-title">No exact matches found</div></div></div>`
                    }
                </div>
                <span class="carousel-fade-overlay"></span>
                <button class="carousel-nav-btn nav-next" title="Next"><svg viewBox="0 0 24 24" fill="none"><path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
            </div>
        `;
        
        group.appendChild(recSection);
        chatBody.appendChild(group);
        
        const carousel = recSection.querySelector('.product-carousel');
        setupCarouselNavigation(carousel);

        // Attach click listeners
        recSection.querySelectorAll('.product-card').forEach(card => {
            card.onclick = () => {
                const pid = card.getAttribute('data-product-id');
                const ageParam = userChoices.age ? `&age=${encodeURIComponent(userChoices.age)}` : '';
                if (pid) window.location.href = `pdp-template.html?id=${pid}${ageParam}`;
            };
        });

        chatBody.scrollTop = chatBody.scrollHeight;
        saveChatState();
    }

    function getProductsByCategoryAndColor(category, color) {
        const colorMap = { 'Navy Blue': 'Navy', 'Blue': 'Blue', 'Green': 'Green', 'Grey': 'Grey', 'Black': 'Black', 'Red': 'Red', 'White': 'White', 'Yellow': 'Yellow' };
        return productsData.filter(p => {
            const matchesCategory = p.type.toLowerCase() === category.toLowerCase();
            const matchesColor = p.colourSwatches.some(s => {
                const jsonColor = s.colourName.toLowerCase();
                const target = (colorMap[color] || color).toLowerCase();
                return jsonColor === target || jsonColor === color.toLowerCase();
            });
            return matchesCategory && matchesColor;
        });
    }

    function renderProductCard(product) {
        const price = product.price;
        const mainColor = product.colourSwatches[0];
        let imgPath = product.productImage;
        if (imgPath.startsWith('/')) imgPath = 'images' + imgPath;

        return `
            <div class="product-card" data-product-id="${product.id}">
                <div class="product-image-container"><img src="${imgPath}" alt="${product.productTitle}" /></div>
                <div class="product-info">
                    <div class="product-brand"><img src="images/next-grey.svg" alt="NEXT" /></div>
                    <div class="product-details-box">
                        <div class="product-title">${product.productTitle}</div>
                        <div class="product-price">£${price.current}</div>
                    </div>
                    <div class="product-form">
                        <div class="color-text">Colour: <span>${mainColor.colourName}</span></div>
                        <div class="color-swatches"><div class="swatch active" style="background-color: ${mainColor.hex};"></div></div>
                    </div>
                </div>
            </div>`;
    }

    // --- Shared Utilities ---
    function initDragScroll(slider) {
        if (!slider) return;
        let isDown = false, startX, scrollLeft;
        slider.onmousedown = (e) => { isDown = true; slider.classList.add('active-dragging'); startX = e.pageX - slider.offsetLeft; scrollLeft = slider.scrollLeft; };
        slider.onmouseleave = () => { isDown = false; slider.classList.remove('active-dragging'); };
        slider.onmouseup = () => { isDown = false; slider.classList.remove('active-dragging'); };
        slider.onmousemove = (e) => { if (!isDown) return; e.preventDefault(); const walk = ((e.pageX - slider.offsetLeft) - startX) * 2; slider.scrollLeft = scrollLeft - walk; };
    }

    function setupCarouselNavigation(carousel) {
        if (!carousel) return;
        const wrapper = carousel.closest('.product-carousel-wrapper');
        const nextBtn = wrapper.querySelector('.nav-next');
        const prevBtn = wrapper.querySelector('.nav-prev');
        const fade = wrapper.querySelector('.carousel-fade-overlay');
        const itemCount = carousel.querySelectorAll('.product-card').length;

        function updateNav() {
            if (itemCount <= 2) { nextBtn.style.display = 'none'; prevBtn.style.display = 'none'; fade.style.display = 'none'; return; }
            const isScrollable = carousel.scrollWidth > carousel.clientWidth + 5;
            if (!isScrollable) { nextBtn.style.display = 'none'; prevBtn.style.display = 'none'; fade.style.display = 'none'; }
            else {
                nextBtn.style.display = 'flex'; fade.style.display = 'block';
                if (carousel.scrollLeft <= 5) prevBtn.classList.remove('visible'); else prevBtn.classList.add('visible');
                if (carousel.scrollLeft + carousel.clientWidth >= carousel.scrollWidth - 5) nextBtn.classList.remove('visible'); else nextBtn.classList.add('visible');
            }
        }
        if (nextBtn) nextBtn.onclick = (e) => { e.stopPropagation(); carousel.scrollBy({ left: 180, behavior: 'smooth' }); };
        if (prevBtn) prevBtn.onclick = (e) => { e.stopPropagation(); carousel.scrollBy({ left: -180, behavior: 'smooth' }); };
        carousel.onscroll = updateNav;
        setTimeout(updateNav, 50);
    }

    function updateAllCarousels() {
        document.querySelectorAll('.product-carousel').forEach(setupCarouselNavigation);
    }
});
