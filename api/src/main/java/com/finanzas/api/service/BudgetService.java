package com.finanzas.api.service;

import com.finanzas.api.dto.request.BudgetRequest;
import com.finanzas.api.dto.response.BudgetResponse;
import com.finanzas.api.model.Budget;
import com.finanzas.api.model.User;
import com.finanzas.api.repository.BudgetRepository;
import com.finanzas.api.repository.PocketRepository;
import com.finanzas.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BudgetService {

    private final BudgetRepository budgetRepository;
    private final PocketRepository pocketRepository;
    private final UserRepository userRepository;

    public List<BudgetResponse> getMyBudgets() {
        UUID userId = getCurrentUser().getUserId();
        return budgetRepository.findByUserUserId(userId)
            .stream().map(this::toResponse).toList();
    }

    public BudgetResponse getByMonthAndYear(Integer month, Integer year) {
        UUID userId = getCurrentUser().getUserId();
        Budget budget = budgetRepository.findByUserUserIdAndMonthAndYear(userId, month, year)
            .orElseThrow(() -> new RuntimeException("Presupuesto no encontrado"));
        return toResponse(budget);
    }

    public BudgetResponse create(BudgetRequest request) {
        User user = getCurrentUser();

        boolean exists = budgetRepository
            .findByUserUserIdAndMonthAndYear(user.getUserId(), request.getMonth(), request.getYear())
            .isPresent();
        if (exists) {
            throw new RuntimeException("Ya existe un presupuesto para ese mes y año");
        }

        Budget budget = new Budget();
        budget.setUser(user);
        budget.setTotalAmount(request.getTotalAmount());
        budget.setMonth(request.getMonth());
        budget.setYear(request.getYear());
        return toResponse(budgetRepository.save(budget));
    }

    public BudgetResponse update(UUID id, BudgetRequest request) {
        Budget budget = budgetRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Presupuesto no encontrado"));
        validateOwnership(budget.getUser().getUserId());

        BigDecimal allocated = pocketRepository.sumAllocatedByBudget(id);
        if (request.getTotalAmount().compareTo(allocated) < 0) {
            throw new RuntimeException("El nuevo monto es menor al ya asignado a bolsillos");
        }

        budget.setTotalAmount(request.getTotalAmount());
        return toResponse(budgetRepository.save(budget));
    }

    private BudgetResponse toResponse(Budget b) {
        BigDecimal allocated = pocketRepository.sumAllocatedByBudget(b.getBudgetId());
        BudgetResponse r = new BudgetResponse();
        r.setBudgetId(b.getBudgetId());
        r.setTotalAmount(b.getTotalAmount());
        r.setAllocatedAmount(allocated);
        r.setRemainingAmount(b.getTotalAmount().subtract(allocated));
        r.setMonth(b.getMonth());
        r.setYear(b.getYear());
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
