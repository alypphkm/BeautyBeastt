// Global array to store all products
let products = [];

// Define beauty product categories with their metadata
const categories = [
    {
        type: 'lipstick',
        icon: 'fas fa-lips',
        title: 'Lipsticks',
        description: 'Find your perfect shade of confidence',
        image: 'assets/images/lipstick.avif'
    },
    {
        type: 'foundation',
        icon: 'fas fa-palette',
        title: 'Foundations',
        description: 'Create your flawless base',
        image: 'assets/images/foundation.avif'
    },
    {
        type: 'mascara',
        icon: 'fas fa-eye',
        title: 'Mascaras',
        description: 'Enhance your natural beauty',
        image: 'assets/images/mascara.WEBP'
    },
    {
        type: 'eyeliner',
        icon: 'fas fa-pen',
        title: 'Eyeliners',
        description: 'Define your look',
        image: 'assets/images/eyeliner.jpg'
    },
    {
        type: 'eyeshadow',
        icon: 'fas fa-paint-brush',
        title: 'Eyeshadows',
        description: 'Express your creativity',
        image: 'assets/images/eyeshadow.jpg'
    },
    {
        type: 'blush',
        icon: 'fas fa-heart',
        title: 'Blushes',
        description: 'Add a natural flush',
        image: 'assets/images/blush.jpg'
    }
];

// Initialize page when DOM is fully loaded
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Products page loaded');
    try {
        // Show loading spinner
        const loadingContainer = document.querySelector('.loading-container');
        loadingContainer.style.display = 'flex';

        // Fetch products from API
        const initialProducts = await window.electronAPI.getProducts({});
        console.log('Fetched products:', initialProducts?.length);

        if (!initialProducts || initialProducts.length === 0) {
            throw new Error('No products received');
        }

        // Store products in global array
        products = initialProducts;

        // Show initial categories view
        displayCategories();

        // Hide loading spinner
        loadingContainer.style.display = 'none';

    } catch (error) {
        console.error('Error loading products:', error);
        showError();
    }
});

// Display beauty categories in a grid
function displayCategories() {
    const grid = document.getElementById('categoryGrid');
    const pageTitle = document.querySelector('.page-title');
    pageTitle.textContent = 'Beauty Categories';
    
    // Generate category cards with staggered animation
    grid.innerHTML = categories.map((category, index) => `
        <div class="category-card" onclick="showProductsByCategory('${category.type}')" 
             style="animation-delay: ${index * 0.1}s">
            <div class="category-image">
                <img src="${category.image}" alt="${category.title}" 
                     onerror="this.src='assets/placeholder.png'">
                <div class="category-overlay">
                    <i class="${category.icon}"></i>
                </div>
            </div>
            <div class="category-info">
                <h3>${category.title}</h3>
                <p>${category.description}</p>
            </div>
        </div>
    `).join('');
}

// Display products for a selected category
async function showProductsByCategory(categoryType) {
    const loadingContainer = document.querySelector('.loading-container');
    const categoryGrid = document.getElementById('categoryGrid');
    const productGrid = document.getElementById('productGrid');
    const pageTitle = document.querySelector('.page-title');
    
    try {
        // Show loading state and hide category grid
        loadingContainer.style.display = 'flex';
        categoryGrid.style.display = 'none';
        
        // Filter products by category
        const categoryProducts = products.filter(product => 
            product.product_type?.toLowerCase() === categoryType.toLowerCase()
        );

        if (categoryProducts.length === 0) {
            throw new Error('No products found in this category');
        }

        // Update page title and display products
        pageTitle.textContent = categories.find(cat => cat.type === categoryType)?.title || 'Products';
        productGrid.style.display = 'grid';
        displayDetailedProducts(categoryProducts);

    } catch (error) {
        console.error('Error:', error);
        showError();
    } finally {
        loadingContainer.style.display = 'none';
    }
}

// Return to categories view
function goBackToCategories() {
    const categoryGrid = document.getElementById('categoryGrid');
    const productGrid = document.getElementById('productGrid');
    const pageTitle = document.querySelector('.page-title');
    
    categoryGrid.style.display = 'grid';
    productGrid.style.display = 'none';
    pageTitle.textContent = 'Beauty Categories';
}

// Display detailed product cards in grid
function displayDetailedProducts(products) {
    const grid = document.getElementById('productGrid');
    
    grid.innerHTML = products.map((product, index) => {
        // Normalize product type for image mapping
        const productType = product.product_type?.toLowerCase().replace(/\s+/g, '') || 'default';
        
        return `
        <div class="product-detail-card" style="animation-delay: ${index * 0.1}s">
            <div class="image-container">
                <img src="${product.image_link}" 
                     alt="${product.name}" 
                     class="product-image"
                     onerror="this.src='assets/placeholder.png'">
                <img src="assets/models/${productType}.jpg" 
                     alt="Model wearing ${product.name}" 
                     class="model-image"
                     onerror="this.src='assets/models/default.jpg'">
                <button class="preview-btn" onclick="togglePreview(this)">
                    <i class="fas fa-eye"></i> Preview
                </button>
            </div>
            <div class="product-details">
                <span class="product-type">${product.product_type || 'makeup'}</span>
                <h3 class="product-name">${product.name}</h3>
                <p class="product-price">$${product.price}</p>
                <div class="rating-container">
                    <div class="stars">
                        ${generateStars(parseFloat(product.rating) || 0)}
                    </div>
                    <span>${product.rating ? `${product.rating}/5` : 'No ratings'}</span>
                </div>
                <p class="description">${product.description || 'No description available.'}</p>
            </div>
        </div>
    `}).join('');
}

// Generate star rating display
function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return `
        ${`<i class="fas fa-star"></i>`.repeat(fullStars)}
        ${hasHalfStar ? `<i class="fas fa-star-half-alt"></i>` : ''}
        ${`<i class="far fa-star"></i>`.repeat(emptyStars)}
    `;
}

// Toggle between product and model images
function togglePreview(button) {
    const container = button.closest('.image-container');
    const productImage = container.querySelector('.product-image');
    const modelImage = container.querySelector('.model-image');
    
    if (modelImage.classList.contains('active')) {
        modelImage.classList.remove('active');
        button.innerHTML = '<i class="fas fa-eye"></i> Preview';
    } else {
        modelImage.classList.add('active');
        button.innerHTML = '<i class="fas fa-eye-slash"></i> Product';
    }
}

// Global error handler for missing images
window.addEventListener('error', function(e) {
    if (e.target.tagName === 'IMG') {
        e.target.src = 'assets/placeholder.png';
    }
}, true); 