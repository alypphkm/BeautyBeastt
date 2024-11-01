document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Load initial products
        const initialProducts = await window.electronAPI.getProducts({});
        products = initialProducts;
        await displayProducts(initialProducts);
        
        // Add search input event listener for Enter key
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    handleSearch();
                }
            });
        }

        // Initialize background changer instead of slideshow
        initializeBackgroundChanger();

    } catch (error) {
        console.error('Error loading initial products:', error);
    }
});

async function displayProducts(productsData) {
    products = productsData;
    const container = document.getElementById('productGrid');
    const hasWishlist = !!localStorage.getItem('currentWishlistId');
    
    container.innerHTML = products.map((product, index) => `
        <div class="product-card" style="--index: ${index}">
            <div class="product-image-wrapper">
                <img src="${product.image_link}" 
                     alt="${product.name}" 
                     class="product-image"
                     onerror="this.src='assets/placeholder.png'"
                     loading="lazy">
                <div class="hover-info">
                    <p class="description">${product.description || 'No description available.'}</p>
                </div>
            </div>
            <div class="product-content">
                <div class="brand-tag">${product.brand}</div>
                <h3 class="product-name">${product.name}</h3>
                <div class="rating-price">
                    <div class="rating">
                        ${generateStars(parseFloat(product.rating) || 0)}
                        <span class="rating-number">${product.rating ? `${product.rating}/5` : 'No ratings'}</span>
                    </div>
                    <div class="price">$${product.price}</div>
                </div>
                ${hasWishlist ? 
                    `<button onclick="addToWishlist('${product.id}')" class="add-to-wishlist-btn">
                        <i class="fas fa-heart"></i> Add to Wishlist
                    </button>` :
                    `<button onclick="navigateToCreateWishlist()" class="create-wishlist-btn">
                        <i class="fas fa-plus"></i> Create Wishlist
                    </button>`
                }
            </div>
        </div>
    `).join('');

    // Add the enhanced styles
    const styles = document.createElement('style');
    styles.textContent = `
        .products-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 2rem;
            padding: 2rem;
        }

        .product-card {
            background: white;
            border-radius: 15px;
            overflow: hidden;
            box-shadow: 0 5px 15px rgba(0,0,0,0.08);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            display: flex;
            flex-direction: column;
            height: 450px;
        }

        .product-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 25px rgba(255,105,180,0.15);
        }

        .product-image-wrapper {
            position: relative;
            height: 250px;
            overflow: hidden;
            background: #f8f9fa;
        }

        .product-image {
            width: 100%;
            height: 100%;
            object-fit: contain;
            transition: transform 0.5s ease;
            padding: 1rem;
        }

        .hover-info {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(255,255,255,0.95);
            padding: 1rem;
            transform: translateY(100%);
            transition: transform 0.3s ease;
        }

        .product-card:hover .hover-info {
            transform: translateY(0);
        }

        .product-content {
            padding: 1.5rem;
            display: flex;
            flex-direction: column;
            gap: 0.8rem;
            flex: 1;
        }

        .brand-tag {
            display: inline-block;
            background: var(--primary-pink);
            color: white;
            padding: 0.3rem 0.8rem;
            border-radius: 20px;
            font-size: 0.9rem;
            align-self: flex-start;
        }

        .product-name {
            font-size: 1.1rem;
            font-weight: 600;
            color: var(--text-dark);
            margin: 0;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }

        .rating-price {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: auto;
        }

        .rating {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .rating i {
            color: #ffd700;
        }

        .price {
            font-size: 1.3rem;
            font-weight: 700;
            color: var(--primary-pink);
        }

        .add-to-wishlist-btn, .create-wishlist-btn {
            width: 100%;
            padding: 0.8rem;
            border: none;
            border-radius: 8px;
            background: linear-gradient(45deg, var(--primary-pink), var(--secondary-pink));
            color: white;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            margin-top: auto;
        }

        .add-to-wishlist-btn:hover, .create-wishlist-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(255,105,180,0.3);
        }
    `;
    
    document.head.appendChild(styles);
}

function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return `
        ${'<i class="fas fa-star"></i>'.repeat(fullStars)}
        ${hasHalfStar ? '<i class="fas fa-star-half-alt"></i>' : ''}
        ${'<i class="far fa-star"></i>'.repeat(emptyStars)}
    `;
}

const additionalStyles = `
.add-to-wishlist-btn, .create-wishlist-btn {
    width: 100%;
    padding: 0.8rem;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin-top: 1rem;
}

.add-to-wishlist-btn {
    background: var(--primary-pink);
    color: white;
}

.create-wishlist-btn {
    background: var(--secondary-pink);
    color: white;
}

.finish-section {
    text-align: center;
    margin-top: 2rem;
}

.finish-btn {
    padding: 1rem 2rem;
    background: var(--primary-pink);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 1.1rem;
    transition: all 0.3s ease;
}

.finish-btn:hover {
    background: var(--secondary-pink);
}
`;

function showSuccessPopup(message) {
    // Remove existing popup if any
    const existingPopup = document.querySelector('.beautybeast-popup');
    if (existingPopup) {
        existingPopup.remove();
    }

    // Create new popup
    const popup = document.createElement('div');
    popup.className = 'beautybeast-popup';
    popup.innerHTML = `
        <i class="fas fa-check-circle popup-icon"></i>
        <div class="popup-content">
            <h4 class="popup-title">Success!</h4>
            <p class="popup-message">${message}</p>
        </div>
        <button class="popup-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
        <div class="popup-progress"></div>
    `;

    document.body.appendChild(popup);

    // Remove popup after animation
    setTimeout(() => popup.remove(), 3500);
}

async function addToWishlist(productId) {
    try {
        const currentWishlistId = localStorage.getItem('currentWishlistId');
        console.log('Current wishlist ID:', currentWishlistId);
        console.log('Product ID to add:', productId);
        console.log('Available products:', products); // Debug log
        
        if (!currentWishlistId) {
            alert('Please create a wishlist first!');
            window.location.href = 'wishlist.html';
            return;
        }

        // Find product with more flexible ID comparison
        const product = products.find(p => {
            console.log('Comparing:', String(p.id), 'vs', String(productId));
            return String(p.id) === String(productId);
        });

        if (!product) {
            console.error('Product not found:', productId);
            alert('Product not found!');
            return;
        }

        // Create a clean product object
        const cleanProduct = {
            id: String(product.id),
            name: product.name,
            brand: product.brand,
            price: product.price,
            image_link: product.image_link,
            product_type: product.product_type
        };

        console.log('Adding product:', cleanProduct);
        const result = await window.electronAPI.addToWishlist({
            wishlistId: currentWishlistId,
            product: cleanProduct
        });

        console.log('Add to wishlist result:', result);
        showSuccessPopup('Product added to wishlist successfully!');
    } catch (error) {
        console.error('Detailed error adding to wishlist:', error);
        alert(`Failed to add product to wishlist: ${error.message}`);
    }
}
// Add search functionality
async function handleSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    try {
        // Filter the existing products
        const filteredProducts = products.filter(product => 
            product.name.toLowerCase().includes(searchTerm) ||
            product.brand.toLowerCase().includes(searchTerm)
        );
        await displayProducts(filteredProducts);
    } catch (error) {
        console.error('Error during search:', error);
    }
}

// Add price filter functionality
async function applyPriceFilter() {
    const minPrice = parseFloat(document.getElementById('minPrice').value) || 0;
    const maxPrice = parseFloat(document.getElementById('maxPrice').value) || Infinity;
    
    try {
        const filteredProducts = products.filter(product => {
            const price = parseFloat(product.price);
            return price >= minPrice && price <= maxPrice;
        });
        await displayProducts(filteredProducts);
    } catch (error) {
        console.error('Error applying price filter:', error);
    }
}

// Add category filter functionality
async function filterByCategory() {
    const category = document.getElementById('productType').value.toLowerCase();
    try {
        const filteredProducts = category ? 
            products.filter(product => 
                product.product_type.toLowerCase().includes(category)
            ) : products;
        await displayProducts(filteredProducts);
    } catch (error) {
        console.error('Error filtering by category:', error);
    }
}

// Replace the slideshow initialization with this new background changer
function initializeBackgroundChanger() {
    const images = [
        'assets/images/won.jpg',
        'assets/images/won2.jpg',
        'assets/images/v.jpg'
    ];
    
    let currentImageIndex = 0;
    const heroHeader = document.querySelector('.hero-header');
    
    // Set initial background
    heroHeader.style.backgroundImage = `url(${images[0]})`;
    
    // Change background every 5 seconds
    setInterval(() => {
        currentImageIndex = (currentImageIndex + 1) % images.length;
        
        // Create new image object to preload next image
        const nextImage = new Image();
        nextImage.src = images[currentImageIndex];
        
        nextImage.onload = () => {
            heroHeader.style.backgroundImage = `url(${images[currentImageIndex]})`;
        };
    }, 5000);
}
