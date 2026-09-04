package com.portfolio.order.service;

import com.portfolio.order.model.Product;
import com.portfolio.order.model.ProductStatus;
import com.portfolio.order.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Service class for Product business logic.
 * Implements caching for improved performance.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ProductService {

    private final ProductRepository productRepository;

    /**
     * Get all ACTIVE products from the database.
     * Soft-deleted (INACTIVE) products are excluded from the result.
     * Results are cached in the "products" cache.
     *
     * @return List of all active products
     */
    @Cacheable(value = "products")
    public List<Product> getAllProducts() {
        log.info("Fetching all active products from database...");
        return productRepository.findByStatus(ProductStatus.ACTIVE);
    }

    /**
     * Save a new product to the database.
     * Clears the "products" cache after successful save.
     *
     * @param product The product to save
     * @return The saved product with generated ID
     */
    @CacheEvict(value = "products", allEntries = true)
    public Product saveProduct(Product product) {
        log.info("Saving new product: {}", product.getName());
        return productRepository.save(product);
    }

    /**
     * Get a product by ID.
     *
     * @param id The product ID
     * @return The product if found
     */
    public Product getProductById(Long id) {
        log.info("Fetching product with ID: {}", id);
        return productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));
    }

    /**
     * Soft-delete a product by ID.
     * Instead of removing the row from the database, the product's
     * status is set to INACTIVE. This preserves historical data and
     * prevents auto-generated IDs from being "wasted" in a way that's
     * visible to the user (the row itself still exists, it's just
     * excluded from normal queries via {@link #getAllProducts()}).
     * Clears the "products" cache after the status change.
     *
     * @param id The product ID to soft-delete
     */
    @CacheEvict(value = "products", allEntries = true)
    public void deleteProduct(Long id) {
        log.info("Soft-deleting product with ID: {} (status -> INACTIVE)", id);
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));
        product.setStatus(ProductStatus.INACTIVE);
        productRepository.save(product);
    }

    /**
     * Search products by name (case-insensitive).
     *
     * @param query The search query
     * @return List of products matching the query
     */
    @Cacheable(value = "products", key = "'search:' + #query")
    public List<Product> searchByName(String query) {
        log.info("Searching products with name containing: {}", query);
        return productRepository.findByNameContainingIgnoreCase(query);
    }
}
