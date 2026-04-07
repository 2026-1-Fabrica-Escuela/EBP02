package com.finanzas.api.repository;

import com.finanzas.api.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface CategoryRepository extends JpaRepository<Category, UUID> {

    @Query("SELECT c FROM Category c WHERE c.user.userId = :userId OR c.user IS NULL")
    List<Category> findMyCategoriesAndGlobal(UUID userId);

    @Query("SELECT c FROM Category c WHERE (c.user.userId = :userId OR c.user IS NULL) AND c.type = :type")
    List<Category> findMyCategoriesAndGlobalByType(UUID userId, String type);
}
