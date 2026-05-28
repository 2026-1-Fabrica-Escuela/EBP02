package com.finanzas.api.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiRecommendationResponse {
    private String category;
    private String motivo;
    private Integer ahorroEstimado;
}
