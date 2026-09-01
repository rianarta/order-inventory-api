package com.portfolio.order;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

/**
 * Main application class for Order & Inventory System.
 * Enables Spring Boot application and caching support.
 */
@SpringBootApplication
@EnableCaching
public class OrderInventoryApplication {

    public static void main(String[] args) {
        SpringApplication.run(OrderInventoryApplication.class, args);
    }
}
