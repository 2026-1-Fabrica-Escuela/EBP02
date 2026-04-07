package com.finanzas.api.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class TransactionRequest {
    @NotNull
    private UUID categoryId;
    private UUID pocketId;
    @NotNull @DecimalMin("0.01")
    private BigDecimal amount;
    private String description;
    @NotNull
    private LocalDate date;
    @NotBlank @Pattern(regexp = "PENDING|COMPLETED|CANCELLED")
    private String status;
}
