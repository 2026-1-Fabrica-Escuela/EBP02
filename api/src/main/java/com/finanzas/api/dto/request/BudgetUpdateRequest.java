package com.finanzas.api.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class BudgetUpdateRequest {
    @NotNull(message = "Por favor completa todos los campos obligatorios")
    @DecimalMin(value = "0.01", message = "El monto del presupuesto debe ser mayor a cero")
    private BigDecimal totalAmount;
}
