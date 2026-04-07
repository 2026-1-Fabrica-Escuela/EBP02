package com.finanzas.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class CategoryRequest {
    @NotBlank
    private String title;
    @NotBlank @Pattern(regexp = "INCOME|EXPENSE")
    private String type;
}
