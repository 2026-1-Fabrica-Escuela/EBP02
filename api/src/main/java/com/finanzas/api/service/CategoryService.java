package com.finanzas.api.service;

import com.finanzas.api.dto.request.CategoryRequest;
import com.finanzas.api.dto.response.CategoryResponse;
import com.finanzas.api.model.Category;
import com.finanzas.api.model.User;
import com.finanzas.api.repository.CategoryRepository;
import com.finanzas.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    public List<CategoryResponse> getMyCategories() {
        UUID userId = getCurrentUser().getUserId();
        return categoryRepository.findMyCategoriesAndGlobal(userId) // Usar nueva query
            .stream().map(this::toResponse).toList();
    }

    public List<CategoryResponse> getMyCategoriesByType(String type) {
        UUID userId = getCurrentUser().getUserId();
        return categoryRepository.findMyCategoriesAndGlobalByType(userId, type) // Usar nueva query
            .stream().map(this::toResponse).toList();
    }

    public CategoryResponse create(CategoryRequest request) {
        User user = getCurrentUser();
        Category category = new Category();
        category.setUser(user);
        category.setTitle(request.getTitle());
        category.setType(request.getType());
        return toResponse(categoryRepository.save(category));
    }

    public CategoryResponse update(UUID id, CategoryRequest request) {
        Category category = categoryRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Categoría no encontrada"));
        validateOwnership(category); // Pasar el objeto completo
        category.setTitle(request.getTitle());
        category.setType(request.getType());
        return toResponse(categoryRepository.save(category));
    }

    public void delete(UUID id) {
        Category category = categoryRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Categoría no encontrada"));
        validateOwnership(category); // Pasar el objeto completo
        categoryRepository.delete(category);
    }

    private CategoryResponse toResponse(Category c) {
        CategoryResponse r = new CategoryResponse();
        r.setCategoryId(c.getCategoryId());
        r.setTitle(c.getTitle());
        r.setType(c.getType());
        return r;
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
    }

    private void validateOwnership(Category category) {
        // Si la categoría no tiene usuario, es GLOBAL y no se puede tocar
        if (category.getUser() == null) {
            throw new RuntimeException("No puedes modificar una categoría global del sistema");
        }

        // Si tiene usuario, verificar que sea el dueño
        if (!getCurrentUser().getUserId().equals(category.getUser().getUserId())) {
            throw new RuntimeException("No tienes permiso para esta acción");
        }
    }
}
