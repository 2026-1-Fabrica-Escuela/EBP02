package com.finanzas.api.service;

import com.finanzas.api.dto.request.BudgetRequest;
import com.finanzas.api.dto.request.BudgetUpdateRequest;
import com.finanzas.api.model.Pocket;
import com.finanzas.api.dto.response.BudgetResponse;
import com.finanzas.api.model.Budget;
import com.finanzas.api.model.User;
import com.finanzas.api.repository.BudgetRepository;
import com.finanzas.api.repository.PocketRepository;
import com.finanzas.api.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class BudgetServiceTest {

    @Mock private BudgetRepository budgetRepository;
    @Mock private PocketRepository pocketRepository;
    @Mock private UserRepository userRepository;
    @Mock private SecurityContext securityContext;
    @Mock private Authentication authentication;

    @InjectMocks
    private BudgetService budgetService;

    private User currentUser;
    private UUID userId;
    private UUID budgetId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        budgetId = UUID.randomUUID();

        currentUser = new User();
        currentUser.setUserId(userId);
        currentUser.setEmail("usuario@test.com");

        SecurityContextHolder.setContext(securityContext);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn("usuario@test.com");
        when(userRepository.findByEmail("usuario@test.com")).thenReturn(Optional.of(currentUser));
    }

    // ─── HU-19 C2: actualización válida ──────────────────────────────────────

    @Test
    void update_validData_returnsUpdatedBudget() {
        Budget budget = buildBudget(new BigDecimal("500.00"), 5, 2025);
        when(budgetRepository.findById(budgetId)).thenReturn(Optional.of(budget));
        when(pocketRepository.sumAllocatedByBudget(budgetId)).thenReturn(BigDecimal.ZERO);
        when(budgetRepository.save(any(Budget.class))).thenAnswer(i -> i.getArgument(0));

        BudgetUpdateRequest req = buildUpdateRequest(new BigDecimal("800.00"));
        BudgetResponse response = budgetService.update(budgetId, req);

        assertNotNull(response);
        assertEquals(new BigDecimal("800.00"), response.getTotalAmount());
    }

    // ─── HU-19 C5: monto menor al asignado a bolsillos (con múltiples bolsillos)

    @Test
    void update_amountLessThanAllocated_throwsException() {
        Budget budget = buildBudget(new BigDecimal("500.00"), 5, 2025);
        when(budgetRepository.findById(budgetId)).thenReturn(Optional.of(budget));

        // Simular 2 bolsillos para que se ejecute la validación de monto mínimo
        Pocket p1 = new Pocket(); p1.setAllocatedAmount(new BigDecimal("200.00"));
        Pocket p2 = new Pocket(); p2.setAllocatedAmount(new BigDecimal("200.00"));
        when(pocketRepository.findByBudgetBudgetId(budgetId)).thenReturn(List.of(p1, p2));
        when(pocketRepository.sumAllocatedByBudget(budgetId)).thenReturn(new BigDecimal("400.00"));

        RuntimeException ex = assertThrows(RuntimeException.class,
            () -> budgetService.update(budgetId, buildUpdateRequest(new BigDecimal("300.00"))));

        assertTrue(ex.getMessage().contains("menor al ya asignado"));
    }

    // ─── HU-19: presupuesto no encontrado ────────────────────────────────────

    @Test
    void update_budgetNotFound_throwsException() {
        when(budgetRepository.findById(budgetId)).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class,
            () -> budgetService.update(budgetId, buildUpdateRequest(new BigDecimal("500.00"))));

        assertEquals("Presupuesto no encontrado", ex.getMessage());
    }

    // ─── create: duplicado ────────────────────────────────────────────────────

    @Test
    void create_duplicatePeriod_throwsException() {
        when(budgetRepository.findByUserUserIdAndMonthAndYear(userId, 5, 2025))
            .thenReturn(Optional.of(buildBudget(new BigDecimal("500.00"), 5, 2025)));

        BudgetRequest req = new BudgetRequest();
        req.setTotalAmount(new BigDecimal("600.00"));
        req.setMonth(5);
        req.setYear(2025);

        RuntimeException ex = assertThrows(RuntimeException.class,
            () -> budgetService.create(req));

        assertEquals("Ya existe un presupuesto para ese mes y año", ex.getMessage());
    }

    // ─── helpers ─────────────────────────────────────────────────────────────

    private Budget buildBudget(BigDecimal amount, int month, int year) {
        Budget b = new Budget();
        b.setBudgetId(budgetId);
        b.setUser(currentUser);
        b.setTotalAmount(amount);
        b.setMonth(month);
        b.setYear(year);
        return b;
    }

    private BudgetUpdateRequest buildUpdateRequest(BigDecimal amount) {
        BudgetUpdateRequest req = new BudgetUpdateRequest();
        req.setTotalAmount(amount);
        return req;
    }
}
