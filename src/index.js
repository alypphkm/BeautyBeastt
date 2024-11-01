const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

if (require('electron-squirrel-startup')) {
  app.quit();
}

// Define wishlists directory path
const wishlistsDir = path.join(__dirname, 'assets', 'wishlists');

const createWindow = async () => {
  // Ensure wishlists directory exists before creating window
  try {
    await ensureWishlistsDir();
  } catch (error) {
    console.error('Failed to create wishlists directory:', error);
  }

  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Make the window fullscreen on startup
  mainWindow.maximize(); // This will maximize the window
  // OR
  // mainWindow.setFullScreen(true); // This will make it truly fullscreen (no taskbar)

  mainWindow.loadFile(path.join(__dirname, 'splash.html'));
};

// Ensure wishlists directory exists
async function ensureWishlistsDir() {
    try {
        await fs.access(wishlistsDir);
        console.log('Wishlists directory exists:', wishlistsDir);
    } catch {
        console.log('Creating wishlists directory:', wishlistsDir);
        await fs.mkdir(wishlistsDir, { recursive: true });
    }
}

// Add this function to handle API calls with retry
async function fetchWithRetry(url, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
        }
    }
}

// IPC Handlers
ipcMain.handle('get-products', async (event, filters = {}) => {
    try {
        const response = await fetchWithRetry('http://makeup-api.herokuapp.com/api/v1/products.json?brand=maybelline');
        console.log('API Response:', response?.length, 'products');
        return response;
    } catch (error) {
        console.error('Error fetching products:', error);
        throw error;
    }
});

// Wishlist handlers
ipcMain.handle('create-wishlist', async (event, userData) => {
    try {
        // Create wishlist ID and ensure it has .txt extension
        const wishlistId = `${userData.userName.toLowerCase()}_wishlist.txt`;
        const filePath = path.join(wishlistsDir, wishlistId);
        
        // Create initial wishlist structure
        const wishlist = {
            id: wishlistId,
            userName: userData.userName,
            userGender: userData.userGender,
            userAge: userData.userAge,
            items: []  // Initialize empty items array
        };

        // Write the wishlist to file
        await fs.writeFile(filePath, JSON.stringify(wishlist, null, 2));
        console.log('Created wishlist file at:', filePath);

        return wishlistId;
    } catch (error) {
        console.error('Error creating wishlist:', error);
        throw error;
    }
});

ipcMain.handle('get-wishlists', async () => {
    try {
        const files = await fs.readdir(wishlistsDir);
        const wishlists = await Promise.all(
            files.map(async (file) => {
                const filePath = path.join(wishlistsDir, file);
                const content = await fs.readFile(filePath, 'utf8');
                const wishlist = JSON.parse(content);
                return {
                    id: file,
                    ...wishlist,
                    items: wishlist.items || [] // Ensure items array exists
                };
            })
        );
        console.log('Retrieved wishlists:', wishlists); // Debug log
        return wishlists;
    } catch (error) {
        console.error('Error getting wishlists:', error);
        throw error;
    }
});

ipcMain.handle('get-wishlist', async (event, wishlistId) => {
    try {
        // Make sure we're using the correct file path
        const filePath = path.join(wishlistsDir, wishlistId);
        console.log('Reading wishlist from:', filePath); // Debug log
        
        const content = await fs.readFile(filePath, 'utf8');
        const wishlist = JSON.parse(content);
        
        return {
            id: wishlistId,
            ...wishlist
        };
    } catch (error) {
        console.error('Error reading wishlist:', error);
        throw new Error('Failed to load wishlist');
    }
});

ipcMain.handle('add-to-wishlist', async (event, { wishlistId, product }) => {
    try {
        console.log('Received request with:', { wishlistId, product });
        
        if (!wishlistId) {
            throw new Error('No wishlistId provided');
        }

        // List all files in directory to debug
        const files = await fs.readdir(wishlistsDir);
        console.log('Available files in wishlist directory:', files);

        // Ensure wishlistId has .txt extension
        const fileName = wishlistId.endsWith('.txt') ? wishlistId : `${wishlistId}.txt`;
        const filePath = path.join(wishlistsDir, fileName);
        
        console.log('Attempting to read from:', filePath);

        // Check if file exists before reading
        try {
            await fs.access(filePath);
        } catch (error) {
            console.error('Wishlist file does not exist:', filePath);
            throw new Error(`Wishlist file not found: ${fileName}`);
        }

        // Read existing wishlist
        const content = await fs.readFile(filePath, 'utf8');
        console.log('Read content:', content);

        let wishlist;
        try {
            wishlist = JSON.parse(content);
        } catch (error) {
            console.error('Failed to parse wishlist JSON:', error);
            throw new Error('Invalid wishlist file format');
        }

        // Initialize items array if it doesn't exist
        if (!Array.isArray(wishlist.items)) {
            console.log('Initializing items array');
            wishlist.items = [];
        }

        // Add product
        wishlist.items.push(product);
        console.log('Updated wishlist:', wishlist);

        // Save updated wishlist
        await fs.writeFile(filePath, JSON.stringify(wishlist, null, 2));
        console.log('Successfully saved wishlist');

        return wishlist;
    } catch (error) {
        console.error('Detailed error in add-to-wishlist:', error);
        throw error;
    }
});

ipcMain.handle('delete-wishlist', async (event, wishlistId) => {
    const filePath = path.join(wishlistsDir, wishlistId);
    await fs.unlink(filePath);
    return true;
});

ipcMain.handle('remove-from-wishlist', async (event, { wishlistId, productId }) => {
    try {
        console.log('Removing product:', productId, 'from wishlist:', wishlistId);
        
        if (!wishlistId) {
            throw new Error('Wishlist ID is required');
        }
        
        // Construct the file path
        const filePath = path.join(wishlistsDir, wishlistId);
        console.log('Reading file from:', filePath);
        
        // Read the current wishlist file
        const content = await fs.readFile(filePath, 'utf8');
        let wishlist = JSON.parse(content);
        
        // Remove the product from items array
        wishlist.items = wishlist.items.filter(item => item.id !== productId);
        
        // Write the updated wishlist back to file
        await fs.writeFile(filePath, JSON.stringify(wishlist, null, 2));
        
        console.log('Product removed successfully');
        return wishlist;
    } catch (error) {
        console.error('Error removing product from wishlist:', error);
        throw error;
    }
});

// Update the handler for updating wishlist info
ipcMain.handle('update-wishlist-info', async (event, wishlistId, info) => {
    try {
        const filePath = path.join(wishlistsDir, wishlistId);
        
        // Read current wishlist data
        const content = await fs.readFile(filePath, 'utf8');
        const wishlist = JSON.parse(content);
        
        // Only update the fields that were provided
        if (info.userName !== undefined) wishlist.userName = info.userName;
        if (info.userGender !== undefined) wishlist.userGender = info.userGender;
        if (info.userAge !== undefined) wishlist.userAge = parseInt(info.userAge) || wishlist.userAge;
        
        // Keep existing items
        wishlist.items = wishlist.items || [];
        
        // Write back to file
        await fs.writeFile(filePath, JSON.stringify(wishlist, null, 2));
        console.log('Updated wishlist:', wishlist);
        
        return wishlist;
    } catch (error) {
        console.error('Error updating wishlist info:', error);
        throw error;
    }
});

// Add these with your other IPC handlers
ipcMain.on('minimize-window', () => {
  BrowserWindow.getFocusedWindow()?.minimize();
});

ipcMain.on('maximize-window', () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win?.isMaximized()) {
    win.unmaximize();
  } else {
    win?.maximize();
  }
});

ipcMain.on('close-window', () => {
  BrowserWindow.getFocusedWindow()?.close();
});

// App lifecycle
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});