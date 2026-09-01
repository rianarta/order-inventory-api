/**
 * Order & Inventory System - Frontend JavaScript
 * Handles API communication and UI interactions
 */

const API_BASE_URL = '/api/products';

// DOM Elements
const productForm = document.getElementById('productForm');
const productTableBody = document.getElementById('productTableBody');
const productTable = document.getElementById('productTable');
const loadingSpinner = document.getElementById('loadingSpinner');
const errorMessage = document.getElementById('errorMessage');
const emptyState = document.getElementById('emptyState');
const refreshBtn = document.getElementById('refreshBtn');
const deleteModal = document.getElementById('deleteModal');
const confirmDeleteBtn = document.getElementById('confirmDelete');
const cancelDeleteBtn = document.getElementById('cancelDelete');

// State
let productToDelete = null;

/**
 * Initialize the application
 */
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    setupEventListeners();
});

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    productForm.addEventListener('submit', handleFormSubmit);
    refreshBtn.addEventListener('click', loadProducts);
    confirmDeleteBtn.addEventListener('click', confirmDelete);
    cancelDeleteBtn.addEventListener('click', closeModal);
    deleteModal.addEventListener('click', (e) => {
        if (e.target === deleteModal) closeModal();
    });
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
        
        const products = await response.json();
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
 * Render products to the table
 * @param {Array} products - Array of product objects
 */
function renderProducts(products) {
    if (!products || products.length === 0) {
        productTable.classList.add('hidden');
        emptyState.classList.remove('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    productTable.classList.remove('hidden');
    
    productTableBody.innerHTML = products.map(product => `
        <tr data-id="${product.id}">
            <td>#${product.id}</td>
            <td>${escapeHtml(product.name)}</td>
            <td>${formatCurrency(product.price)}</td>
            <td>${product.stock}</td>
            <td>
                <button class="btn btn-danger btn-small" onclick="openDeleteModal(${product.id})">
                    Delete
                </button>
            </td>
        </tr>
    `).join('');
}

/**
 * Handle form submission
 * @param {Event} event - Form submit event
 */
async function handleFormSubmit(event) {
    event.preventDefault();
    
    const formData = {
        name: document.getElementById('name').value.trim(),
        price: parseFloat(document.getElementById('price').value),
        stock: parseInt(document.getElementById('stock').value, 10)
    };
    
    // Validate
    if (!formData.name || isNaN(formData.price) || isNaN(formData.stock)) {
        showError('Please fill in all fields correctly.');
        return;
    }
    
    if (formData.price < 0 || formData.stock < 0) {
        showError('Price and stock must be non-negative values.');
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
        
        // Success
        productForm.reset();
        showToast('Product added successfully!', 'success');
        await loadProducts();
        
    } catch (error) {
        console.error('Error creating product:', error);
        showError('Failed to add product. Please try again.');
    }
}

/**
 * Open delete confirmation modal
 * @param {number} productId - ID of product to delete
 */
function openDeleteModal(productId) {
    productToDelete = productId;
    deleteModal.classList.remove('hidden');
}

/**
 * Close delete modal
 */
function closeModal() {
    productToDelete = null;
    deleteModal.classList.add('hidden');
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
        closeModal();
        await loadProducts();
        
    } catch (error) {
        console.error('Error deleting product:', error);
        showError('Failed to delete product. Please try again.');
        closeModal();
    }
}

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - 'success' or 'error'
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
 * @param {boolean} show
 */
function showLoading(show) {
    if (show) {
        loadingSpinner.classList.remove('hidden');
        productTable.classList.add('hidden');
        emptyState.classList.add('hidden');
    } else {
        loadingSpinner.classList.add('hidden');
    }
}

/**
 * Show error message
 * @param {string} message
 */
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
}

/**
 * Hide error message
 */
function hideError() {
    errorMessage.classList.add('hidden');
}

/**
 * Format currency
 * @param {number} amount
 * @returns {string}
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(amount);
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text
 * @returns {string}
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make functions available globally for inline event handlers
window.openDeleteModal = openDeleteModal;
