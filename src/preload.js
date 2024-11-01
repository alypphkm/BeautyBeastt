const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Product operations
  getProducts: (filters) => ipcRenderer.invoke('get-products', filters),
  
  // Wishlist operations
  createWishlist: (userData) => ipcRenderer.invoke('create-wishlist', userData),
  getWishlists: () => ipcRenderer.invoke('get-wishlists'),
  getWishlist: (wishlistId) => ipcRenderer.invoke('get-wishlist', wishlistId),
  addToWishlist: (data) => ipcRenderer.invoke('add-to-wishlist', data),
  deleteWishlist: (wishlistId) => ipcRenderer.invoke('delete-wishlist', wishlistId),
  removeFromWishlist: (wishlistId, productId) => 
      ipcRenderer.invoke('remove-from-wishlist', { wishlistId, productId }),
  updateWishlistName: (wishlistId, newName) => 
      ipcRenderer.invoke('updateWishlistName', wishlistId, newName),
  updateWishlistInfo: (wishlistId, info) => 
      ipcRenderer.invoke('update-wishlist-info', wishlistId, info),
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),
});