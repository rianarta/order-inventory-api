/**
 * Order & Inventory System - Frontend JavaScript
 * Handles API communication and UI interactions
 */

const API_BASE_URL = '/api/products';

// State
let products = [];
let productToDelete = null;
let selectedImage = null;

/**
 * Dashboard Initialization
 */
function initDashboard() {
    setupDashboardListeners();
    loadProducts();
}

/**
 * Add Product Page Initialization
 */
function initAddProduct() {
    setupAddProductListeners();
}

/**
 * Setup Dashboard Event Listeners
 */
function setupDashboardListeners() {
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    
    if (searchInput) {
        searchInput.addEventListener('input', debounce((e) => {
            filterProducts(e.target.value);
        }, 300));
    }
    
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            const query = searchInput.value.trim();
            filterProducts(query);
        });
    }
    
    // Refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadProducts);
    }
    
    // Edit form
    const editForm = document.getElementById('editForm');
    if (editForm) {
        editForm.addEventListener('submit', handleEditSubmit);
    }
    
    // Cancel edit
    const cancelEditBtn = document.getElementById('cancelEdit');
    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', closeEditModal);
    }
    
    // Upload form
    const uploadForm = document.getElementById('uploadForm');
    if (uploadForm) {
        uploadForm.addEventListener('submit', handleUploadSubmit);
    }
    
    // Cancel upload
    const cancelUploadBtn = document.getElementById('cancelUpload');
    if (cancelUploadBtn) {
        cancelUploadBtn.addEventListener('click', closeUploadModal);
    }
    
    // Delete modal
    const confirmDeleteBtn = document.getElementById('confirmDelete');
    const cancelDeleteBtn = document.getElementById('cancelDelete');
    const deleteModal = document.getElementById('deleteModal');
    
    if (confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', confirmDelete);
    if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    if (deleteModal) {
        deleteModal.addEventListener('click', (e) => {
            if (e.target === deleteModal) closeDeleteModal();
        });
    }
}

/**
 * Setup Add Product Page Event Listeners
 */
function setupAddProductListeners() {
    const addProductForm = document.getElementById('addProductForm');
    const imageUploadArea = document.getElementById('imageUploadArea');
    const imageFileInput = document.getElementById('imageFile');
    const removeImageBtn = document.getElementById('removeImage');
    
    if (addProductForm) {
        addProductForm.addEventListener('submit', handleAddProductSubmit);
    }
    
    if (imageUploadArea && imageFileInput) {
        imageUploadArea.addEventListener('click', () => {
            imageFileInput.click();
        });
        
        imageUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            imageUploadArea.classList.add('drag-over');
        });
        
        imageUploadArea.addEventListener('dragleave', () => {
            imageUploadArea.classList.remove('drag-over');
        });
        
        imageUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            imageUploadArea.classList.remove('drag-over');
            const files = e.dataTransfer.files;
            if (files.length > 0 && files[0].type.startsWith('image/')) {
                handleImageSelect(files[0]);
            }
        });
    }
    
    if (imageFileInput) {
        imageFileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleImageSelect(e.target.files[0]);
            }
        });
    }
    
    if (removeImageBtn) {
        removeImageBtn.addEventListener('click', removeSelectedImage);
    }
}

/**
 * Load all products from the API
 */
async function loadProducts() {
    showLoading(true);
    hideError();
    
    try {
        const response = await fetch(API_BASE_URL);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        products = await response.json();
        updateStatistics(products);
        renderProducts(products);
    } catch (error) {
        console.error('Error loading products:', error);
        showError('Failed to load products. Please check if the server is running.');
        renderProducts([]);
    } finally {
        showLoading(false);
    }
}

/**
 * Update statistics cards
 */
function updateStatistics(products) {
    const totalProducts = products.length;
    const totalStock = products.reduce((sum, p) => sum + (p.stock || 0), 0);
    const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock || 0), 0);
    const lowStock = products.filter(p => p.stock < 10).length;
    
    document.getElementById('totalProducts').textContent = totalProducts;
    document.getElementById('totalStock').textContent = totalStock;
    document.getElementById('totalValue').textContent = formatCurrency(totalValue);
    document.getElementById('lowStock').textContent = lowStock;
}

/**
 * Filter products by search query
 */
function filterProducts(query) {
    if (!query || query.trim() === '') {
        renderProducts(products);
        return;
    }
    
    const filtered = products.filter(p => 
        p.name.toLowerCase().includes(query.toLowerCase())
    );
    renderProducts(filtered);
}

/**
 * Render products to the grid
 */
function renderProducts(products) {
    const productGrid = document.getElementById('productGrid');
    const emptyState = document.getElementById('emptyState');
    
    if (!productGrid) return;
    
    if (!products || products.length === 0) {
        productGrid.innerHTML = '';
        productGrid.classList.add('hidden');
        if (emptyState) emptyState.classList.remove('hidden');
        return;
    }
    
    if (emptyState) emptyState.classList.add('hidden');
    productGrid.classList.remove('hidden');
    
    productGrid.innerHTML = products.map(product => `
        <div class="product-card" data-id="${product.id}">
            <div class="product-image">
                ${product.imageUrl 
                    ? `<img src="/uploads/${product.imageUrl}" alt="${escapeHtml(product.name)}" onerror="this.parentElement.innerHTML='<div class=\\'product-placeholder\\'>📦</div>'">`
                    : '<div class="product-placeholder">📦</div>'
                }
            </div>
            <div class="product-info">
                <h3 class="product-name">${escapeHtml(product.name)}</h3>
                <p class="product-price">${formatCurrency(product.price)}</p>
                <p class="product-stock ${product.stock < 10 ? 'low' : ''}">Stock: ${product.stock}</p>
                ${product.description ? `<p class="product-description">${escapeHtml(product.description)}</p>` : ''}
                <div class="product-actions">
                    <button class="btn btn-secondary btn-small" onclick="openEditModal(${product.id})">
                        ✏️ Edit
                    </button>
                    <button class="btn btn-warning btn-small" onclick="openUploadModal(${product.id})">
                        📷 Image
                    </button>
                    <button class="btn btn-danger btn-small" onclick="openDeleteModal(${product.id})">
                        🗑️ Delete
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * Handle Add Product form submission
 */
async function handleAddProductSubmit(event) {
    event.preventDefault();
    
    const formData = {
        name: document.getElementById('name').value.trim(),
        price: parseFloat(document.getElementById('price').value),
        stock: parseInt(document.getElementById('stock').value, 10),
        description: document.getElementById('description').value.trim()
    };
    
    // Validate
    if (!formData.name || isNaN(formData.price) || isNaN(formData.stock)) {
        showToast('Please fill in all required fields correctly.', 'error');
        return;
    }
    
    if (formData.price < 0 || formData.stock < 0) {
        showToast('Price and stock must be non-negative values.', 'error');
        return;
    }
    
    try {
        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const savedProduct = await response.json();
        
        // If image was selected, upload it
        if (selectedImage) {
            await uploadImageForProduct(savedProduct.id, selectedImage);
        }
        
        showToast('Product added successfully!', 'success');
        document.getElementById('addProductForm').reset();
        removeSelectedImage();
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
        
    } catch (error) {
        console.error('Error creating product:', error);
        showToast('Failed to add product. Please try again.', 'error');
    }
}

/**
 * Upload image for a product
 */
async function uploadImageForProduct(productId, file) {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const response = await fetch(`${API_BASE_URL}/${productId}/image`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            console.error('Failed to upload image');
        }
    } catch (error) {
        console.error('Error uploading image:', error);
    }
}

/**
 * Handle Image Selection
 */
function handleImageSelect(file) {
    // Validate file type
    if (!file.type.startsWith('image/')) {
        showToast('Please select an image file.', 'error');
        return;
    }
    
    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
        showToast('Image size must be less than 5MB.', 'error');
        return;
    }
    
    selectedImage = file;
    
    const imageUploadArea = document.getElementById('imageUploadArea');
    const imagePreview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    
    if (imageUploadArea) imageUploadArea.style.display = 'none';
    if (imagePreview) {
        imagePreview.style.display = 'block';
        const reader = new FileReader();
        reader.onload = (e) => {
            if (previewImg) previewImg.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

/**
 * Remove Selected Image
 */
function removeSelectedImage() {
    selectedImage = null;
    
    const imageUploadArea = document.getElementById('imageUploadArea');
    const imagePreview = document.getElementById('imagePreview');
    const imageFileInput = document.getElementById('imageFile');
    
    if (imageUploadArea) imageUploadArea.style.display = 'block';
    if (imagePreview) imagePreview.style.display = 'none';
    if (imageFileInput) imageFileInput.value = '';
}

/**
 * Open Edit Modal
 */
function openEditModal(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    document.getElementById('editId').value = product.id;
    document.getElementById('editName').value = product.name;
    document.getElementById('editPrice').value = product.price;
    document.getElementById('editStock').value = product.stock;
    document.getElementById('editDescription').value = product.description || '';
    
    document.getElementById('editModal').classList.remove('hidden');
}

/**
 * Close Edit Modal
 */
function closeEditModal() {
    document.getElementById('editModal').classList.add('hidden');
}

/**
 * Handle Edit Form Submit
 */
async function handleEditSubmit(event) {
    event.preventDefault();
    
    const productId = document.getElementById('editId').value;
    
    const formData = {
        name: document.getElementById('editName').value.trim(),
        price: parseFloat(document.getElementById('editPrice').value),
        stock: parseInt(document.getElementById('editStock').value, 10),
        description: document.getElementById('editDescription').value.trim()
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/${productId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        showToast('Product updated successfully!', 'success');
        closeEditModal();
        await loadProducts();
        
    } catch (error) {
        console.error('Error updating product:', error);
        showToast('Failed to update product. Please try again.', 'error');
    }
}

/**
 * Open Upload Image Modal
 */
function openUploadModal(productId) {
    document.getElementById('uploadProductId').value = productId;
    document.getElementById('previewImage').src = '';
    document.getElementById('imageFile').value = '';
    
    // Show current image if exists
    const product = products.find(p => p.id === productId);
    if (product && product.imageUrl) {
        document.getElementById('previewImage').src = `/uploads/${product.imageUrl}`;
    }
    
    document.getElementById('uploadModal').classList.remove('hidden');
    
    // Preview selected image
    document.getElementById('imageFile').addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            const reader = new FileReader();
            reader.onload = (event) => {
                document.getElementById('previewImage').src = event.target.result;
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    });
}

/**
 * Close Upload Modal
 */
function closeUploadModal() {
    document.getElementById('uploadModal').classList.add('hidden');
}

/**
 * Handle Image Upload Submit
 */
async function handleUploadSubmit(event) {
    event.preventDefault();
    
    const productId = document.getElementById('uploadProductId').value;
    const fileInput = document.getElementById('imageFile');
    
    if (!fileInput.files.length) {
        showToast('Please select an image to upload.', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    
    try {
        const response = await fetch(`${API_BASE_URL}/${productId}/image`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        showToast('Image uploaded successfully!', 'success');
        closeUploadModal();
        await loadProducts();
        
    } catch (error) {
        console.error('Error uploading image:', error);
        showToast('Failed to upload image. Please try again.', 'error');
    }
}

/**
 * Open delete confirmation modal
 */
function openDeleteModal(productId) {
    productToDelete = productId;
    document.getElementById('deleteModal').classList.remove('hidden');
}

/**
 * Close delete modal
 */
function closeDeleteModal() {
    productToDelete = null;
    document.getElementById('deleteModal').classList.add('hidden');
}

/**
 * Confirm and execute deletion
 */
async function confirmDelete() {
    if (!productToDelete) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/${productToDelete}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        showToast('Product deleted successfully!', 'success');
        closeDeleteModal();
        await loadProducts();
        
    } catch (error) {
        console.error('Error deleting product:', error);
        showToast('Failed to delete product. Please try again.', 'error');
        closeDeleteModal();
    }
}

/**
 * Show toast notification
 */
function showToast(message, type = 'success') {
    const existingToast = document.querySelector('.toast');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

/**
 * Show/hide loading spinner
 */
function showLoading(show) {
    const loadingSpinner = document.getElementById('loadingSpinner');
    const productGrid = document.getElementById('productGrid');
    const emptyState = document.getElementById('emptyState');
    
    if (show) {
        if (loadingSpinner) loadingSpinner.classList.remove('hidden');
        if (productGrid) productGrid.classList.add('hidden');
        if (emptyState) emptyState.classList.add('hidden');
    } else {
        if (loadingSpinner) loadingSpinner.classList.add('hidden');
    }
}

/**
 * Show error message
 */
function showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    if (errorMessage) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
    }
}

/**
 * Hide error message
 */
function hideError() {
    const errorMessage = document.getElementById('errorMessage');
    if (errorMessage) {
        errorMessage.classList.add('hidden');
    }
}

/**
 * Format currency
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Debounce function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Make functions available globally
window.openDeleteModal = openDeleteModal;
window.openEditModal = openEditModal;
window.openUploadModal = openUploadModal;
