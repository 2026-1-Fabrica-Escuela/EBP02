package com.finanzas.api.controller;

import com.finanzas.api.dto.response.AiRecommendationResponse;
import com.finanzas.api.service.AiAdviceService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AiAdviceController.class)
@AutoConfigureMockMvc(addFilters = false) // Disable security for this test
class AiAdviceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AiAdviceService aiAdviceService;

    @MockBean
    private com.finanzas.api.security.JwtUtil jwtUtil;

    @MockBean
    private org.springframework.security.core.userdetails.UserDetailsService userDetailsService;

    @Test
    @WithMockUser
    void generateRecommendations_ShouldReturnList() throws Exception {
        // Arrange
        AiRecommendationResponse rec = new AiRecommendationResponse("Alimentación", "Gasta menos", 100);
        when(aiAdviceService.generateRecommendations(anyString())).thenReturn(List.of(rec));

        // Act & Assert
        mockMvc.perform(get("/api/v1/recommendations/generate")
                        .param("month", "2024-05")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].category").value("Alimentación"))
                .andExpect(jsonPath("$[0].motivo").value("Gasta menos"))
                .andExpect(jsonPath("$[0].ahorroEstimado").value(100));
    }
}
