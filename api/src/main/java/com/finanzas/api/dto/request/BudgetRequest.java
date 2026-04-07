package com.finanzas.api.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class BudgetRequest {
    @NotNull @DecimalMin("0.01")
    private BigDecimal totalAmount;
    @NotNull @Min(1) @Max(12)
    private Integer month;
    @NotNull @Min(2000)
    private Integer year;
}

