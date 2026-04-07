package com.finanzas.api.dto.response;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class TransactionResponse {
    private UUID transactionId;
    private BigDecimal amount;
    private String description;
    private String status;
    private LocalDate date;
    private String categoryTitle;
    private String categoryType;
    private String pocketTitle;
}
