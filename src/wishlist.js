document.addEventListener('DOMContentLoaded', async () => {
    await loadWishlists();
    
    // Add event listener for create wishlist button
    const createBtn = document.getElementById('createWishlistBtn');
    if (createBtn) {
        createBtn.addEventListener('click', () => {
            document.getElementById('createWishlistModal').style.display = 'flex';
        });
    }
});

async function createWishlist() {
    const userName = document.getElementById('userName').value.trim();
    const userGender = document.getElementById('userGender').value.trim();
    const userAge = document.getElementById('userAge').value;
    
    if (!userName) {
        alert('Please enter your name');
        return;
    }
    if (!userGender) {
        alert('Please select your gender');
        return;
    }
    if (!userAge || userAge < 1) {
        alert('Please enter a valid age');
        return; 
    }

    try {
        const wishlistId = await window.electronAPI.createWishlist({
            userName,
            userGender,
            userAge: parseInt(userAge)
        });
        
        localStorage.setItem('currentWishlistId', wishlistId);
        
        alert('Wishlist created successfully!');
        await loadWishlists(); // Refresh the display
        closeModal();
    } catch (error) {
        console.error('Error creating wishlist:', error);
        alert('Failed to create wishlist');
    }
}

async function loadWishlists() {
    try {
        const wishlists = await window.electronAPI.getWishlists();
        displayWishlists(wishlists);
    } catch (error) {
        console.error('Error loading wishlists:', error);
        alert('Failed to load wishlists');
    }
}

function displayWishlists(wishlists) {
    const container = document.getElementById('wishlistsContainer');
    container.innerHTML = wishlists.map(wishlist => {
        const wishlistId = wishlist.id || `${wishlist.userName.toLowerCase()}_wishlist.txt`;
        return `
            <div class="wishlist-card">
                <div class="wishlist-info">
                    <h3>${wishlist.userName}'s Wishlist</h3>
                    <p>Gender: ${wishlist.userGender} | Age: ${wishlist.userAge}</p>
                </div>
                <div class="wishlist-actions">
                    <button onclick="addMoreProducts('${wishlist.id}')" class="action-btn add-btn">
                        <i class="fas fa-plus"></i> Add Products
                    </button>
                    <button onclick="editWishlist('${wishlist.id}')" class="action-btn edit-btn">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button onclick="deleteWishlist('${wishlist.id}')" class="action-btn delete-btn">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
                <!-- Add Calculate Price Button and Total Display -->
                <div class="price-section">
                    <button onclick="calculateTotalPrice('${wishlist.id}')" class="action-btn calculate-btn">
                        <i class="fas fa-calculator"></i> Calculate Total
                    </button>
                    <div class="total-price" id="total-${wishlist.id}"></div>
                </div>
                <!-- Products list remains the same -->
                <div class="wishlist-items">
                    ${wishlist.items.map(item => `
                        <div class="wishlist-item">
                            <img src="${item.image_link}" alt="${item.name}" 
                                 onerror="this.src='assets/placeholder.png'">
                            <div class="item-info">
                                <h4>${item.name}</h4>
                                <p>${item.brand}</p>
                                <p class="price">$${item.price}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('');
}

async function addMoreProducts(wishlistId) {
    // Ensure the wishlist exists before setting it
    try {
        const wishlists = await window.electronAPI.getWishlists();
        const wishlistExists = wishlists.some(w => w.id === wishlistId);
        
        if (!wishlistExists) {
            console.log('Wishlist not found, clearing localStorage');
            localStorage.removeItem('currentWishlistId');
            alert('Wishlist not found. Please create a new one.');
            return;
        }
        
        localStorage.setItem('currentWishlistId', wishlistId);
        window.location.href = 'home.html';
    } catch (error) {
        console.error('Error checking wishlist:', error);
        alert('Error accessing wishlist');
    }
}

let currentEditingWishlist = null;

async function editWishlist(wishlistId) {
    try {
        const wishlist = await window.electronAPI.getWishlist(wishlistId);
        currentEditingWishlist = wishlist;
        
        // Populate the edit modal with current values
        document.getElementById('editWishlistName').value = wishlist.userName || '';
        document.getElementById('editWishlistGender').value = wishlist.userGender || '';
        document.getElementById('editWishlistAge').value = wishlist.userAge || '';
        
        // Show the modal
        document.getElementById('editWishlistModal').style.display = 'flex';
    } catch (error) {
        console.error('Error loading wishlist for editing:', error);
        alert('Failed to load wishlist for editing: ' + error.message);
    }
}

function displayEditProducts(products) {
    const container = document.getElementById('editProductsList');
    
    if (!container) {
        console.error('Edit products container not found');
        return;
    }
    
    if (!products || products.length === 0) {
        container.innerHTML = '<p class="no-products">No products in wishlist</p>';
        return;
    }

    container.innerHTML = products.map(product => `
        <div class="edit-product-item">
            <div class="product-info-container">
                <img src="${product.image_link}" alt="${product.name}"
                     onerror="this.src='assets/placeholder.png'">
                <div class="product-text">
                    <h5 class="product-name">${product.name}</h5>
                    <p class="product-brand">${product.brand}</p>
                    <p class="product-price">$${product.price}</p>
                </div>
            </div>
            <button onclick="removeProduct('${product.id}')" class="remove-product-btn">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
}

async function removeProduct(productId) {
    try {
        if (!currentEditingWishlist) {
            throw new Error('No wishlist is currently being edited');
        }

        // Debug logs
        console.log('Current editing wishlist:', currentEditingWishlist);
        console.log('Removing product:', productId);
        
        // Use the wishlist ID as is, don't add another extension
        const wishlistId = currentEditingWishlist.id;
        
        console.log('Using wishlist ID:', wishlistId); // Debug log
        
        // Call the API to remove the product
        const updatedWishlist = await window.electronAPI.removeFromWishlist(
            wishlistId,
            productId
        );

        // Update the current editing wishlist
        currentEditingWishlist = {
            ...updatedWishlist,
            id: wishlistId
        };

        // Refresh the displays
        displayEditProducts(currentEditingWishlist.items);
        await loadWishlists(); // Refresh the main wishlist display

        console.log('Product removed successfully');
    } catch (error) {
        console.error('Error removing product:', error);
        alert('Failed to remove product: ' + error.message);
    }
}

async function saveWishlistName() {
    if (!currentEditingWishlist) return;
    
    const newName = document.getElementById('editWishlistName').value.trim();
    if (!newName) {
        alert('Please enter a valid name');
        return;
    }

    try {
        await window.electronAPI.updateWishlistName(currentEditingWishlist.id, newName);
        currentEditingWishlist.userName = newName;
        alert('Wishlist name updated successfully!');
        loadWishlists(); // Refresh the display
    } catch (error) {
        console.error('Error updating wishlist name:', error);
        alert('Failed to update wishlist name');
    }
}

async function deleteWishlist(wishlistId) {
    // Create and show custom modal
    const modalHTML = `
        <div class="delete-modal">
            <div class="delete-modal-content">
                <div class="delete-icon">
                    <i class="fas fa-exclamation-circle"></i>
                </div>
                <h3>Delete Wishlist?</h3>
                <p>Are you sure you want to delete this wishlist? This action cannot be undone.</p>
                <div class="delete-modal-buttons">
                    <button class="delete-confirm-btn">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                    <button class="delete-cancel-btn">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const deleteModal = document.querySelector('.delete-modal');
    const result = await new Promise((resolve) => {
        const confirmBtn = deleteModal.querySelector('.delete-confirm-btn');
        const cancelBtn = deleteModal.querySelector('.delete-cancel-btn');

        confirmBtn.addEventListener('click', () => {
            deleteModal.remove();
            resolve(true);
        });

        cancelBtn.addEventListener('click', () => {
            deleteModal.remove();
            resolve(false);
        });
    });

    if (result) {
        try {
            await window.electronAPI.deleteWishlist(wishlistId);
            loadWishlists();
        } catch (error) {
            console.error('Error deleting wishlist:', error);
            showErrorToast('Failed to delete wishlist');
        }
    }
}

function closeModal() {
    document.getElementById('createWishlistModal').style.display = 'none';
    document.getElementById('userName').value = '';
}

function closeEditModal() {
    const modal = document.getElementById('editWishlistModal');
    modal.style.display = 'none';
    currentEditingWishlist = null;
}

async function saveWishlistChanges() {
    if (!currentEditingWishlist) {
        alert('No wishlist selected for editing');
        return;
    }

    try {
        // Get values from form
        const newName = document.getElementById('editWishlistName').value;
        const newGender = document.getElementById('editWishlistGender').value;
        const newAge = document.getElementById('editWishlistAge').value;

        // Create update object with only changed values
        const updates = {};
        
        if (newName && newName !== currentEditingWishlist.userName) {
            updates.userName = newName;
        }
        if (newGender && newGender !== currentEditingWishlist.userGender) {
            updates.userGender = newGender;
        }
        if (newAge && parseInt(newAge) !== currentEditingWishlist.userAge) {
            updates.userAge = parseInt(newAge);
        }

        // Only update if there are changes
        if (Object.keys(updates).length > 0) {
            await window.electronAPI.updateWishlistInfo(currentEditingWishlist.id, updates);
            alert('Wishlist updated successfully!');
            await loadWishlists(); // Refresh the display
        }
        
        closeEditModal();
    } catch (error) {
        console.error('Error updating wishlist:', error);
        alert('Failed to update wishlist: ' + error.message);
    }
}

async function removeFromWishlist(wishlistId, productId) {
    try {
        await window.electronAPI.removeFromWishlist(wishlistId, productId);
        await loadWishlists(); // Refresh the display
    } catch (error) {
        console.error('Error removing product:', error);
        alert('Failed to remove product from wishlist');
    }
}

// Add the calculate price function
async function calculateTotalPrice(wishlistId) {
    try {
        const wishlist = await window.electronAPI.getWishlist(wishlistId);
        const total = wishlist.items.reduce((sum, item) => {
            return sum + parseFloat(item.price || 0);
        }, 0);

        const totalElement = document.getElementById(`total-${wishlistId}`);
        totalElement.innerHTML = `
            <div class="total-price-display">
                <span>Total Price:</span>
                <span class="price-value">$${total.toFixed(2)}</span>
            </div>
        `;
        
        // Add animation class
        totalElement.classList.add('price-calculated');
        setTimeout(() => totalElement.classList.remove('price-calculated'), 500);
    } catch (error) {
        console.error('Error calculating total:', error);
        alert('Failed to calculate total price');
    }
}
