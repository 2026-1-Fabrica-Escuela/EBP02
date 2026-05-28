package com.finanzas.api.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.finanzas.api.dto.response.AiRecommendationResponse;
import com.finanzas.api.model.Budget;
import com.finanzas.api.model.User;
import com.finanzas.api.repository.BudgetRepository;
import com.finanzas.api.repository.PocketRepository;
import com.finanzas.api.repository.TransactionRepository;
import com.finanzas.api.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.io.IOException;
import java.net.http.HttpClient;
import java.net.http.HttpResponse;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AiAdviceServiceTest {

    @Mock
    private TransactionRepository transactionRepository;
    @Mock
    private BudgetRepository budgetRepository;
    @Mock
    private PocketRepository pocketRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ObjectMapper objectMapper;
    @Mock
    private HttpClient httpClient;
    @Mock
    private HttpResponse<String> httpResponse;
    @Mock
    private SecurityContext securityContext;
    @Mock
    private Authentication authentication;

    @InjectMocks
    private AiAdviceService aiAdviceService;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.setContext(securityContext);
    }

    @Test
    void generateRecommendations_Success() throws IOException, InterruptedException {
        // Arrange
        String month = "2024-05";
        User user = new User();
        user.setUserId(java.util.UUID.randomUUID());
        user.setEmail("test@example.com");

        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn("test@example.com");
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));

        when(transactionRepository.findByUserAndTypeAndPeriod(any(java.util.UUID.class), anyString(), any(), any()))
                .thenReturn(Collections.emptyList());
        when(budgetRepository.findByUserUserIdAndMonthAndYear(any(java.util.UUID.class), anyInt(), anyInt()))
                .thenReturn(Optional.of(new Budget()));
        when(pocketRepository.findByBudgetBudgetId(any())).thenReturn(Collections.emptyList());

        when(objectMapper.writeValueAsString(any())).thenReturn("{}");
        
        when(httpClient.send(any(java.net.http.HttpRequest.class), any(java.net.http.HttpResponse.BodyHandler.class)))
                .thenReturn(httpResponse);
        when(httpResponse.statusCode()).thenReturn(200);
        
        String mockResponseBody = "{\"candidates\": [{\"content\": {\"parts\": [{\"text\": \"[{\\\"category\\\": \\\"Alimentación\\\", \\\"motivo\\\": \\\"Reducir gastos\\\", \\\"ahorroEstimado\\\": 50000}]\"}]}}]}";
        when(httpResponse.body()).thenReturn(mockResponseBody);
        
        // Mocking the two calls to readValue
        // 1. To parse the Gemini response body
        // 2. To parse the actual recommendations JSON string
        when(objectMapper.readValue(eq(mockResponseBody), any(com.fasterxml.jackson.core.type.TypeReference.class)))
                .thenReturn(Collections.singletonMap("candidates", List.of(
                        Collections.singletonMap("content", Collections.singletonMap("parts", List.of(
                                Collections.singletonMap("text", "[{\"category\": \"Alimentación\", \"motivo\": \"Reducir gastos\", \"ahorroEstimado\": 50000}]")
                        )))
                )));

        AiRecommendationResponse rec = new AiRecommendationResponse("Alimentación", "Reducir gastos", 50000);
        when(objectMapper.readValue(eq("[{\"category\": \"Alimentación\", \"motivo\": \"Reducir gastos\", \"ahorroEstimado\": 50000}]"), any(com.fasterxml.jackson.core.type.TypeReference.class)))
                .thenReturn(List.of(rec));

        // Act
        List<AiRecommendationResponse> results = aiAdviceService.generateRecommendations(month);

        // Assert
        assertNotNull(results);
        assertEquals(1, results.size());
        assertEquals("Alimentación", results.get(0).getCategory());
        verify(httpClient).send(any(), any());
    }

    @Test
    void generateRecommendations_UserNotFound() {
        // Arrange
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn("nonexistent@example.com");
        when(userRepository.findByEmail("nonexistent@example.com")).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(RuntimeException.class, () -> aiAdviceService.generateRecommendations("2024-05"));
    }

    @Test
    void generateRecommendations_ApiError() throws IOException, InterruptedException {
        // Arrange
        String month = "2024-05";
        User user = new User();
        user.setUserId(java.util.UUID.randomUUID());
        user.setEmail("test@example.com");

        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn("test@example.com");
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));

        when(transactionRepository.findByUserAndTypeAndPeriod(any(java.util.UUID.class), anyString(), any(), any()))
                .thenReturn(Collections.emptyList());
        
        when(objectMapper.writeValueAsString(any())).thenReturn("{}");
        
        when(httpClient.send(any(java.net.http.HttpRequest.class), any(java.net.http.HttpResponse.BodyHandler.class)))
                .thenReturn(httpResponse);
        when(httpResponse.statusCode()).thenReturn(500);
        when(httpResponse.body()).thenReturn("Internal Server Error");

        // Act & Assert
        assertThrows(RuntimeException.class, () -> aiAdviceService.generateRecommendations(month));
    }
}
