package com.finanzas.api.service;

import com.finanzas.api.dto.request.PocketRequest;
import com.finanzas.api.dto.response.PocketResponse;
import com.finanzas.api.model.*;
import com.finanzas.api.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PocketService {

    private final PocketRepository pocketRepository;
    private final BudgetRepository budgetRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    public List<PocketResponse> getMyPockets() {
        UUID userId = getCurrentUser().getUserId();
        return pocketRepository.findByUserUserId(userId)
            .stream().map(this::toResponse).toList();
    }

    public List<PocketResponse> getPocketsByBudget(UUID budgetId) {
        return pocketRepository.findByBudgetBudgetId(budgetId)
            .stream().map(this::toResponse).toList();
    }

    public PocketResponse create(PocketRequest request) {
        User user = getCurrentUser();

        Budget budget = budgetRepository.findById(request.getBudgetId())
            .orElseThrow(() -> new RuntimeException("Presupuesto no encontrado"));

        BigDecimal alreadyAllocated = pocketRepository.sumAllocatedByBudget(budget.getBudgetId());
        BigDecimal available = budget.getTotalAmount().subtract(alreadyAllocated);

        if (request.getAllocatedAmount().compareTo(available) > 0) {
            throw new RuntimeException("Monto excede el presupuesto disponible. Disponible: " + available);
        }

        Pocket pocket = new Pocket();
        pocket.setUser(user);
        pocket.setBudget(budget);
        pocket.setTitle(request.getTitle());
        pocket.setAllocatedAmount(request.getAllocatedAmount());
        pocket.setCurrentAmount(request.getAllocatedAmount());
        pocket.setIsSavings(request.getIsSavings());

        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Categoría no encontrada"));
            pocket.setCategory(category);
        }

        return toResponse(pocketRepository.save(pocket));
    }

    public void delete(UUID id) {
        Pocket pocket = pocketRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Bolsillo no encontrado"));
        validateOwnership(pocket.getUser().getUserId());
        pocketRepository.delete(pocket);
    }

    private PocketResponse toResponse(Pocket p) {
        PocketResponse r = new PocketResponse();
        r.setPocketId(p.getPocketId());
        r.setTitle(p.getTitle());
        r.setAllocatedAmount(p.getAllocatedAmount());
        r.setCurrentAmount(p.getCurrentAmount());
        r.setIsSavings(p.getIsSavings());
        r.setBudgetId(p.getBudget() != null ? p.getBudget().getBudgetId() : null);
        r.setCategoryTitle(p.getCategory() != null ? p.getCategory().getTitle() : null);
        return r;
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
    }

    private void validateOwnership(UUID ownerId) {
        if (!getCurrentUser().getUserId().equals(ownerId)) {
            throw new RuntimeException("No tienes permiso para esta acción");
        }
    }
}
