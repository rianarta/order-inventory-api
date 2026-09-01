package com.portfolio.order.service;

import com.portfolio.order.model.Product;
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
     * Get all products from the database.
     * Results are cached in the "products" cache.
     *
     * @return List of all products
     */
    @Cacheable(value = "products")
    public List<Product> getAllProducts() {
        log.info("Fetching all products from database...");
        return productRepository.findAll();
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
     * Delete a product by ID.
     * Clears the "products" cache after successful deletion.
     *
     * @param id The product ID to delete
     */
    @CacheEvict(value = "products", allEntries = true)
    public void deleteProduct(Long id) {
        log.info("Deleting product with ID: {}", id);
        productRepository.deleteById(id);
    }
}
