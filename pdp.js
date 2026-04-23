/**
 * pdp.js — Clean, manageable PDP logic
 * Handles navigation from PLP and populates the UI with product data
 */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Read Product ID from URL
    const params = new URLSearchParams(window.location.search);
    const productId = params.get("id") || 'BJ-001'; // Default for testing if needed

    // 2. Retrieve Product from JSON
    fetch('product.json')
        .then(response => response.json())
        .then(data => {
            const products = data.products;
            const product = getProductById(products, productId);
            
            if (product) {
                populatePDP(product);
            } else {
                console.error("Product not found:", productId);
            }
        })
        .catch(err => console.error("Error loading products:", err));

    function getProductById(products, id) {
        return products.find(p => p.id === id);
    }

    function populatePDP(product) {
        // Main Image
        const mainImg = document.querySelector(".product-image");
        if (mainImg) mainImg.src = getFullImgPath(product.productImage);

        // Thumbnail Images
        const thumbnails = document.querySelector(".thumbnails");
        if (thumbnails) {
            const thumbList = product.thumbnailImages && product.thumbnailImages.length > 0 
                ? product.thumbnailImages 
                : [product.productImage];
                
            thumbnails.innerHTML = thumbList.map((img, i) => `
                <div class="thumb-item ${i === 0 ? 'active' : ''}">
                    <img src="${getFullImgPath(img)}" alt="Thumbnail" />
                </div>
            `).join("");

            thumbnails.querySelectorAll('.thumb-item').forEach(item => {
                const img = item.querySelector('img');
                item.addEventListener('click', () => {
                    if (mainImg) mainImg.src = img.src;
                    thumbnails.querySelectorAll('.thumb-item').forEach(t => t.classList.remove('active'));
                    item.classList.add('active');
                });
            });
        }

        // Standard Fields
        const title = document.querySelector(".product-title");
        if (title) title.textContent = product.productTitle;

        const price = document.querySelector(".product-price");
        if (price) price.textContent = `£${product.price.current}`;

        const code = document.querySelector(".product-code");
        if (code) code.textContent = product.productCodes?.sku || product.id;

        const reviews = document.querySelector(".reviews");
        if (reviews && product.reviews) {
            renderStars(reviews, product.reviews.averageRating);
            
            // Add numerical rating and count
            const ratingText = document.createElement('span');
            ratingText.className = 'rating-text-value';
            ratingText.innerHTML = `${product.reviews.averageRating} (${product.reviews.reviewCount})`;
            reviews.appendChild(ratingText);
        }

        const desc = document.getElementById("productDescription");
        if (desc) {
            // desc.textContent = product.description; // Disabled to preserve high-fidelity template text
        }

        renderVariationOptions(product);

        // Auto-select size if passed in URL
        const ageInUrl = params.get('age');
        const sizeSelect = document.getElementById('sizeSelect');
        if (ageInUrl && sizeSelect) {
            // Check if option exists (match value, which is just the age)
            let optionExists = Array.from(sizeSelect.options).some(opt => opt.value === ageInUrl);
            if (!optionExists) {
                const newOpt = document.createElement('option');
                newOpt.value = ageInUrl;
                newOpt.textContent = ageInUrl;
                sizeSelect.appendChild(newOpt);
            }
            sizeSelect.value = ageInUrl;
        }
    }

    function getFullImgPath(path) {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
        return `images/${cleanPath}`;
    }

    function renderStars(container, rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = (rating % 1) >= 0.5;
        let starHTML = '';
        for (let i = 0; i < fullStars; i++) starHTML += `<img src="images/icons/filled-star.svg" class="star-icon" alt="Star">`;
        if (hasHalfStar) starHTML += `<img src="images/icons/half-star.svg" class="star-icon" alt="Half Star">`;
        while (starHTML.split('<img').length - 1 < 5) starHTML += `<img src="images/icons/blank-star.svg" class="star-icon" alt="Empty Star">`;
        container.innerHTML = starHTML;
    }

    function renderVariationOptions(product) {
        const colorContainer = document.getElementById('colorPills');
        const sizeSelect = document.getElementById('sizeSelect');
        const fitContainer = document.querySelector('.fit-pills');
        const fitGroup = document.getElementById('fitGroup');

        if (colorContainer && product.colourSwatches) {
            colorContainer.innerHTML = product.colourSwatches.map((opt, i) => `
                <div class="color-pill ${i === 0 ? 'active' : ''}" title="${opt.colourName}">
                    <div class="inner-color" style="background-color: ${opt.hex};"></div>
                </div>
            `).join("");
            const selectedColorLabel = document.getElementById('selectedColorName');
            if (selectedColorLabel && product.colourSwatches[0]) selectedColorLabel.textContent = product.colourSwatches[0].colourName;
        }

        if (fitGroup) {
            if (product.fits && product.fits.length > 0) {
                fitGroup.style.display = 'block';
                if (fitContainer) {
                    fitContainer.innerHTML = product.fits.map((fit, i) => `<button class="fit-pill ${i === 0 ? 'active' : ''}">${fit}</button>`).join("");
                }
            } else {
                fitGroup.style.display = 'none';
            }
        }

        if (sizeSelect && product.sizes) {
            sizeSelect.innerHTML = '<option value="">Choose Size</option>' + 
                product.sizes.map(s => {
                    const sizeVal = typeof s === 'object' ? s.size : s;
                    const displayVal = typeof s === 'object' ? `${s.size} - £${s.price}` : s;
                    return `<option value="${sizeVal}">${displayVal}</option>`;
                }).join("");
        }
    }
});

// --- Chat Trigger (PDP Specific) ---
document.addEventListener('chat-ready', () => {
    const chatBtn = document.querySelector('.chat-btn');
    const chatWindow = document.getElementById('chat-window');
    if (chatBtn && chatWindow) {
        chatBtn.addEventListener('click', (e) => {
            e.preventDefault();
            chatWindow.classList.toggle('open');
        });
    }
});
