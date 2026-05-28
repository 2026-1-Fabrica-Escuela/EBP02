package com.finanzas.api.controller;

import com.finanzas.api.dto.response.AiRecommendationResponse;
import com.finanzas.api.service.AiAdviceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/recommendations")
@RequiredArgsConstructor
public class AiAdviceController {

    private final AiAdviceService aiAdviceService;

    @GetMapping("/generate")
    public ResponseEntity<List<AiRecommendationResponse>> generateRecommendations(
            @RequestParam("month") String month) {
        List<AiRecommendationResponse> recommendations = aiAdviceService.generateRecommendations(month);
        return ResponseEntity.ok(recommendations);
    }
}
