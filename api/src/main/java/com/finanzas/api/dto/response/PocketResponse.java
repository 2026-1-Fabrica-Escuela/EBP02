package com.finanzas.api.dto.response;

import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;

@Data
public class PocketResponse {
    private UUID pocketId;
    private String title;
    private BigDecimal allocatedAmount;
    private BigDecimal currentAmount;
    private Boolean isSavings;
    private String categoryTitle;
    private UUID budgetId;
}

