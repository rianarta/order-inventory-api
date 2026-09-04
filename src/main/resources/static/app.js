/**
 * Order & Inventory System - E-Commerce Style Dashboard
 */

const API_BASE_URL = '/api/products';

// State
let products = [];
let filteredProducts = [];
let currentCategory = 'all';
let productToDelete = null;
let editImageFile = null;

// Category emojis
const categoryEmojis = {
    'all': '📦',
    'minuman': '🥤',
    'makanan': '🍔',
    'snack': '🍿',
    'sarapan': '🥣',
    'mie': '🍜',
    'bumbu': '🧂',
    'perawatan': '🧴',
    'lainnya': '📦'
};

/**
 * Initialize Dashboard
 */
function initDashboard() {
    setupEventListeners();
    loadProducts();
}

/**
 * Setup Event Listeners
 */
function setupEventListeners() {
    // Search
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    
    if (searchInput) {
        searchInput.addEventListener('input', debounce((e) => {
            filterProducts();
        }, 300));
    }
    
    if (searchBtn) {
        searchBtn.addEventListener('click', filterProducts);
    }
    
    // Category pills
    document.querySelectorAll('.category-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            document.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            currentCategory = pill.dataset.category;
            filterProducts();
        });
    });
    
    // Edit form
    const editForm = document.getElementById('editForm');
    if (editForm) {
        editForm.addEventListener('submit', handleEditSubmit);
    }
    
    // Close sidebar
    const closeSidebarBtn = document.getElementById('closeSidebar');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    
    if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', closeSidebar);
    if (cancelEditBtn) cancelEditBtn.addEventListener('click', closeSidebar);
    if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);
    
    // Image upload in sidebar
    const imageUploadSmall = document.getElementById('imageUploadSmall');
    const editImageFile = document.getElementById('editImageFile');
    const removeEditImage = document.getElementById('removeEditImage');
    
    if (imageUploadSmall && editImageFile) {
        imageUploadSmall.addEventListener('click', () => editImageFile.click());
        
        editImageFile.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleEditImageSelect(e.target.files[0]);
            }
        });
    }
    
    if (removeEditImage) {
        removeEditImage.addEventListener('click', removeSelectedEditImage);
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
 * Load Products
 */
async function loadProducts() {
    showLoading(true);
    hideError();
    
    try {
        const response = await fetch(API_BASE_URL);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        products = await response.json();
        filterProducts();
    } catch (error) {
        console.error('Error loading products:', error);
        showError();
        renderProducts([]);
    } finally {
        showLoading(false);
    }
}

/**
 * Filter Products by Category and Search
 */
function filterProducts() {
    const searchQuery = document.getElementById('searchInput').value.toLowerCase().trim();
    
    filteredProducts = products.filter(product => {
        const matchesCategory = currentCategory === 'all' || product.category === currentCategory;
        const matchesSearch = !searchQuery || 
            product.name.toLowerCase().includes(searchQuery) ||
            (product.description && product.description.toLowerCase().includes(searchQuery));
        
        return matchesCategory && matchesSearch;
    });
    
    renderProducts(filteredProducts);
    updateProductCount();
}

/**
 * Render Products
 */
function renderProducts(productsToRender) {
    const productGrid = document.getElementById('productGrid');
    const emptyState = document.getElementById('emptyState');
    
    if (!productGrid) return;
    
    if (!productsToRender || productsToRender.length === 0) {
        productGrid.innerHTML = '';
        productGrid.classList.add('hidden');
        if (emptyState) emptyState.classList.remove('hidden');
        return;
    }
    
    if (emptyState) emptyState.classList.add('hidden');
    productGrid.classList.remove('hidden');
    
    productGrid.innerHTML = productsToRender.map(product => `
        <div class="product-card" data-id="${product.id}">
            <div class="product-image">
                ${product.imageUrl 
                    ? `<img src="/uploads/${product.imageUrl}" alt="${escapeHtml(product.name)}" onerror="this.parentElement.innerHTML='<div class=\\'product-placeholder-img\\'>📦</div>'">`
                    : `<div class="product-placeholder-img">📦</div>`
                }
                <div class="product-actions-card">
                    <button class="btn-icon btn-edit" onclick="openEditSidebar(${product.id})" title="Edit">✏️</button>
                    <button class="btn-icon btn-delete" onclick="openDeleteModal(${product.id})" title="Hapus">🗑️</button>
                </div>
            </div>
            <div class="product-info">
                <h3 class="product-name">${escapeHtml(product.name)}</h3>
                <p class="product-price">${formatCurrency(product.price)}</p>
                <p class="product-stock ${product.stock < 10 ? 'low' : ''}">Stok: ${product.stock}</p>
                ${product.category && product.category !== 'all' ? 
                    `<span class="product-category-badge">${getCategoryEmoji(product.category)} ${capitalizeFirst(product.category)}</span>` 
                    : ''}
                <div class="product-actions-bottom">
                    <button class="btn-edit-product" onclick="openEditSidebar(${product.id})">✏️ Edit</button>
                    <button class="btn-delete-product" onclick="openDeleteModal(${product.id})">🗑️</button>
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * Update Product Count
 */
function updateProductCount() {
    const countEl = document.getElementById('productCount');
    if (countEl) {
        countEl.textContent = `${filteredProducts.length} produk`;
    }
}

/**
 * Get Category Emoji
 */
function getCategoryEmoji(category) {
    return categoryEmojis[category] || '📦';
}

/**
 * Capitalize First Letter
 */
function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Open Edit Sidebar
 */
function openEditSidebar(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    document.getElementById('editId').value = product.id;
    document.getElementById('editName').value = product.name;
    document.getElementById('editPrice').value = product.price;
    document.getElementById('editStock').value = product.stock;
    document.getElementById('editDescription').value = product.description || '';
    document.getElementById('editCategory').value = product.category || 'all';
    
    // Reset image state
    editImageFile = null;
    document.getElementById('editImagePreview').classList.add('hidden');
    document.getElementById('imageUploadSmall').classList.remove('hidden');
    
    // Show existing image if available
    if (product.imageUrl) {
        document.getElementById('editPreviewImg').src = `/uploads/${product.imageUrl}`;
        document.getElementById('editImagePreview').classList.remove('hidden');
        document.getElementById('imageUploadSmall').classList.add('hidden');
    }
    
    // Show sidebar
    document.getElementById('editSidebar').classList.add('active');
    document.getElementById('sidebarOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
}

/**
 * Close Sidebar
 */
function closeSidebar() {
    document.getElementById('editSidebar').classList.remove('active');
    document.getElementById('sidebarOverlay').classList.remove('active');
    document.body.style.overflow = '';
    editImageFile = null;
}

/**
 * Handle Edit Image Select
 */
function handleEditImageSelect(file) {
    if (!file.type.startsWith('image/')) {
        showToast('Pilih file gambar yang valid', 'error');
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        showToast('Ukuran gambar maksimal 5MB', 'error');
        return;
    }
    
    editImageFile = file;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('editPreviewImg').src = e.target.result;
        document.getElementById('editImagePreview').classList.remove('hidden');
        document.getElementById('imageUploadSmall').classList.add('hidden');
    };
    reader.readAsDataURL(file);
}

/**
 * Remove Selected Edit Image
 */
function removeSelectedEditImage() {
    editImageFile = null;
    document.getElementById('editImageFile').value = '';
    document.getElementById('editImagePreview').classList.add('hidden');
    document.getElementById('imageUploadSmall').classList.remove('hidden');
}

/**
 * Handle Edit Submit
 */
async function handleEditSubmit(event) {
    event.preventDefault();
    
    const productId = document.getElementById('editId').value;
    
    const formData = {
        name: document.getElementById('editName').value.trim(),
        price: parseFloat(document.getElementById('editPrice').value),
        stock: parseInt(document.getElementById('editStock').value, 10),
        description: document.getElementById('editDescription').value.trim(),
        category: document.getElementById('editCategory').value
    };
    
    if (!formData.name || isNaN(formData.price) || isNaN(formData.stock)) {
        showToast('Lengkapi semua field yang wajib', 'error');
        return;
    }
    
    try {
        // Update product data
        const response = await fetch(`${API_BASE_URL}/${productId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) throw new Error('Failed to update');
        
        const updatedProduct = await response.json();
        
        // Upload image if selected
        if (editImageFile) {
            const formDataImg = new FormData();
            formDataImg.append('file', editImageFile);
            
            await fetch(`${API_BASE_URL}/${productId}/image`, {
                method: 'POST',
                body: formDataImg
            });
        }
        
        showToast('Produk berhasil diperbarui!', 'success');
        closeSidebar();
        await loadProducts();
        
    } catch (error) {
        console.error('Error updating product:', error);
        showToast('Gagal memperbarui produk', 'error');
    }
}

/**
 * Open Delete Modal
 */
function openDeleteModal(productId) {
    productToDelete = productId;
    document.getElementById('deleteModal').classList.remove('hidden');
}

/**
 * Close Delete Modal
 */
function closeDeleteModal() {
    productToDelete = null;
    document.getElementById('deleteModal').classList.add('hidden');
}

/**
 * Confirm Delete
 */
async function confirmDelete() {
    if (!productToDelete) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/${productToDelete}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Failed to delete');
        
        showToast('Produk berhasil dihapus!', 'success');
        closeDeleteModal();
        await loadProducts();
        
    } catch (error) {
        console.error('Error deleting product:', error);
        showToast('Gagal menghapus produk', 'error');
        closeDeleteModal();
    }
}

/**
 * Show Loading
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
 * Show Error
 */
function showError() {
    const errorMessage = document.getElementById('errorMessage');
    if (errorMessage) {
        errorMessage.classList.remove('hidden');
    }
}

/**
 * Hide Error
 */
function hideError() {
    const errorMessage = document.getElementById('errorMessage');
    if (errorMessage) {
        errorMessage.classList.add('hidden');
    }
}

/**
 * Show Toast
 */
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    if (!toast || !toastMessage) return;
    
    toastMessage.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

/**
 * Format Currency
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
 * Escape HTML
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Debounce Function
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
window.openEditSidebar = openEditSidebar;
window.openDeleteModal = openDeleteModal;
