package com.finanzas.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.finanzas.api.dto.request.TransactionUpdateRequest;
import com.finanzas.api.dto.response.TransactionResponse;
import com.finanzas.api.service.TransactionService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(TransactionController.class)
@AutoConfigureMockMvc(addFilters = false)
class TransactionControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @MockitoBean TransactionService transactionService;
    @MockitoBean com.finanzas.api.security.JwtUtil jwtUtil;
    @MockitoBean org.springframework.security.core.userdetails.UserDetailsService userDetailsService;

    private static final UUID TRANSACTION_ID = UUID.randomUUID();
    private static final UUID CATEGORY_ID    = UUID.randomUUID();

    // ─── HU-09 C1: obtener transacción por id → 200 con datos precargados ─────

    @Test
    @WithMockUser
    void getById_exists_returns200() throws Exception {
        TransactionResponse response = buildResponse();
        when(transactionService.getById(TRANSACTION_ID)).thenReturn(response);

        mockMvc.perform(get("/api/transactions/{id}", TRANSACTION_ID))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.transactionId").value(TRANSACTION_ID.toString()))
            .andExpect(jsonPath("$.amount").value(100.00))
            .andExpect(jsonPath("$.description").value("Compra de prueba"));
    }

    @Test
    @WithMockUser
    void getById_notFound_returns400() throws Exception {
        when(transactionService.getById(any())).thenThrow(new RuntimeException("Transacción no encontrada"));

        mockMvc.perform(get("/api/transactions/{id}", TRANSACTION_ID))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Transacción no encontrada"));
    }

    // ─── HU-09 C2: campos obligatorios vacíos → 422 ───────────────────────────

    @Test
    @WithMockUser
    void update_missingCategoryId_returns422() throws Exception {
        String body = """
            {"amount": 100, "date": "2025-06-01", "description": "test"}
            """;

        mockMvc.perform(put("/api/transactions/{id}", TRANSACTION_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isUnprocessableEntity());
    }

    @Test
    @WithMockUser
    void update_missingDate_returns422() throws Exception {
        String body = String.format(
            "{\"amount\": 100, \"categoryId\": \"%s\", \"description\": \"test\"}", CATEGORY_ID);

        mockMvc.perform(put("/api/transactions/{id}", TRANSACTION_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isUnprocessableEntity());
    }

    // ─── HU-09 C3: monto inválido (≤ 0) → 422 ────────────────────────────────

    @Test
    @WithMockUser
    void update_zeroAmount_returns422() throws Exception {
        String body = String.format(
            "{\"amount\": 0, \"categoryId\": \"%s\", \"date\": \"2025-06-01\"}", CATEGORY_ID);

        mockMvc.perform(put("/api/transactions/{id}", TRANSACTION_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isUnprocessableEntity());
    }

    // ─── HU-09 C4: actualización válida → 200 ────────────────────────────────

    @Test
    @WithMockUser
    void update_validData_returns200() throws Exception {
        TransactionResponse response = buildResponse();
        when(transactionService.update(any(), any(TransactionUpdateRequest.class))).thenReturn(response);

        TransactionUpdateRequest req = new TransactionUpdateRequest();
        req.setCategoryId(CATEGORY_ID);
        req.setAmount(new BigDecimal("100.00"));
        req.setDate(LocalDate.of(2025, 6, 1));
        req.setDescription("Compra de prueba");

        mockMvc.perform(put("/api/transactions/{id}", TRANSACTION_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.amount").value(100.00));
    }

    // ─── HU-10 C3: eliminar transacción → 204 ────────────────────────────────

    @Test
    @WithMockUser
    void delete_exists_returns204() throws Exception {
        doNothing().when(transactionService).delete(any());

        mockMvc.perform(delete("/api/transactions/{id}", TRANSACTION_ID))
            .andExpect(status().isNoContent());
    }

    // ─── HU-10 C2: transacción no encontrada → 400 ───────────────────────────

    @Test
    @WithMockUser
    void delete_notFound_returns400() throws Exception {
        doThrow(new RuntimeException("Transacción no encontrada"))
            .when(transactionService).delete(any());

        mockMvc.perform(delete("/api/transactions/{id}", TRANSACTION_ID))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Transacción no encontrada"));
    }

    // ─── helpers ─────────────────────────────────────────────────────────────

    private TransactionResponse buildResponse() {
        TransactionResponse r = new TransactionResponse();
        r.setTransactionId(TRANSACTION_ID);
        r.setAmount(new BigDecimal("100.00"));
        r.setDescription("Compra de prueba");
        r.setStatus("COMPLETED");
        r.setDate(LocalDate.of(2025, 6, 1));
        r.setCategoryTitle("Alimentación");
        r.setCategoryType("EXPENSE");
        return r;
    }
}
