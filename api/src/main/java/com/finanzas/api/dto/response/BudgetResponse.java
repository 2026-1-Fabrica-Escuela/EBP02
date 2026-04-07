package com.finanzas.api.dto.response;

import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;

@Data
public class BudgetResponse {
    private UUID budgetId;
    private BigDecimal totalAmount;
    private BigDecimal allocatedAmount;
    private BigDecimal remainingAmount;
    private Integer month;
    private Integer year;
}
