package com.finanzas.api.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;

@Data
public class PocketRequest {
    @NotNull
    private UUID budgetId;
    private UUID categoryId;
    @NotBlank
    private String title;
    @NotNull @DecimalMin("0.01")
    private BigDecimal allocatedAmount;
    private Boolean isSavings = false;
}
