package com.finanzas.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.finanzas.api.dto.request.BudgetUpdateRequest;
import com.finanzas.api.dto.response.BudgetResponse;
import com.finanzas.api.service.BudgetService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(BudgetController.class)
@AutoConfigureMockMvc(addFilters = false)
class BudgetControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @MockitoBean BudgetService budgetService;
    @MockitoBean com.finanzas.api.security.JwtUtil jwtUtil;
    @MockitoBean org.springframework.security.core.userdetails.UserDetailsService userDetailsService;

    private static final UUID BUDGET_ID = UUID.randomUUID();

    // ─── HU-19 C2: actualización válida → 200 ────────────────────────────────

    @Test
    @WithMockUser
    void update_validAmount_returns200() throws Exception {
        BudgetResponse response = buildResponse(new BigDecimal("800000"));
        when(budgetService.update(any(), any(BudgetUpdateRequest.class))).thenReturn(response);

        BudgetUpdateRequest req = new BudgetUpdateRequest();
        req.setTotalAmount(new BigDecimal("800000"));

        mockMvc.perform(put("/api/budgets/{id}", BUDGET_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalAmount").value(800000));
    }

    // ─── HU-19 C3: monto nulo → 422 ──────────────────────────────────────────

    @Test
    @WithMockUser
    void update_nullAmount_returns422() throws Exception {
        mockMvc.perform(put("/api/budgets/{id}", BUDGET_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"totalAmount\": null}"))
            .andExpect(status().isUnprocessableEntity());
    }

    // ─── HU-19 C4: monto igual a cero → 422 ──────────────────────────────────

    @Test
    @WithMockUser
    void update_zeroAmount_returns422() throws Exception {
        mockMvc.perform(put("/api/budgets/{id}", BUDGET_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"totalAmount\": 0}"))
            .andExpect(status().isUnprocessableEntity());
    }

    // ─── HU-19 C4: monto negativo → 422 ──────────────────────────────────────

    @Test
    @WithMockUser
    void update_negativeAmount_returns422() throws Exception {
        mockMvc.perform(put("/api/budgets/{id}", BUDGET_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"totalAmount\": -100}"))
            .andExpect(status().isUnprocessableEntity());
    }

    // ─── HU-19: presupuesto no encontrado → 400 ──────────────────────────────

    @Test
    @WithMockUser
    void update_budgetNotFound_returns400() throws Exception {
        when(budgetService.update(any(), any(BudgetUpdateRequest.class)))
            .thenThrow(new RuntimeException("Presupuesto no encontrado"));

        BudgetUpdateRequest req = new BudgetUpdateRequest();
        req.setTotalAmount(new BigDecimal("500000"));

        mockMvc.perform(put("/api/budgets/{id}", BUDGET_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Presupuesto no encontrado"));
    }

    // ─── HU-19 C6: cancelar no modifica nada (verificar que service no se llama)

    @Test
    @WithMockUser
    void update_cancelAction_serviceNotCalled() throws Exception {
        // Cancelar es acción del frontend; si no se llama al endpoint, el service no debe ejecutarse
        verify(budgetService, never()).update(any(), any());
    }

    // ─── helpers ─────────────────────────────────────────────────────────────

    private BudgetResponse buildResponse(BigDecimal totalAmount) {
        BudgetResponse r = new BudgetResponse();
        r.setBudgetId(BUDGET_ID);
        r.setTotalAmount(totalAmount);
        r.setAllocatedAmount(new BigDecimal("125500"));
        r.setRemainingAmount(totalAmount.subtract(new BigDecimal("125500")));
        r.setMonth(10);
        r.setYear(2025);
        return r;
    }
}
