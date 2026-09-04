package com.portfolio.order.repository;

import com.portfolio.order.model.Product;
import com.portfolio.order.model.ProductStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository interface for Product entity.
 * Extends JpaRepository to provide CRUD operations.
 */
@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    List<Product> findByStatus(ProductStatus status);
}
