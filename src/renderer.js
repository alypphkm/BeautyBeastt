function showProductDetails(product) {
    const modal = document.getElementById('productModal');
    const modalContent = modal.querySelector('.modal-body');
    
    modalContent.innerHTML = `
        <div class="product-detail-header">
            <img src="${product.image_link}" 
                 onerror="this.src='assets/placeholder.png'" 
                 alt="${product.name}">
            <div class="product-detail-info">
                <h2>${product.name}</h2>
                <p class="brand">${product.brand}</p>
                <p class="price">$${product.price}</p>
            </div>
        </div>
        <div class="product-description">
            <h3>Description</h3>
            <p>${product.description || 'No description available.'}</p>
        </div>
        <div class="product-details">
            <h3>Details</h3>
            <ul>
                <li>Category: ${product.category || 'N/A'}</li>
                <li>Type: ${product.product_type || 'N/A'}</li>
                <li>Rating: ${product.rating || 'N/A'}</li>
            </ul>
        </div>
    `;
    
    modal.classList.add('active');
    setTimeout(() => {
        modal.querySelector('.modal-content').classList.add('active');
    }, 10);
}

function closeModal() {
    const modal = document.getElementById('productModal');
    modal.querySelector('.modal-content').classList.remove('active');
    setTimeout(() => {
        modal.classList.remove('active');
    }, 300);
}

document.getElementById('productModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'productModal') {
        closeModal();
    }
});