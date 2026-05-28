package com.finanzas.api.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.finanzas.api.dto.response.AiRecommendationResponse;
import com.finanzas.api.model.*;
import com.finanzas.api.repository.*;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AiAdviceService {

    private static final Logger logger = LoggerFactory.getLogger(AiAdviceService.class);

    private final TransactionRepository transactionRepository;
    private final BudgetRepository budgetRepository;
    private final PocketRepository pocketRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    @org.springframework.beans.factory.annotation.Value("${gemini.api.key}")
    private String geminiApiKey;

    private String getGeminiApiUrl() {
        return "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash-lite:generateContent?key="
                + geminiApiKey;
    }

    public List<AiRecommendationResponse> generateRecommendations(String month) {
        User user = getCurrentUser();
        LocalDate startDate = LocalDate.parse(month + "-01", DateTimeFormatter.ofPattern("yyyy-MM-dd"));
        LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());

        List<Transaction> expenses = transactionRepository.findByUserAndTypeAndPeriod(
                user.getUserId(), "EXPENSE", startDate, endDate);

        Optional<Budget> budgetOpt = budgetRepository.findByUserUserIdAndMonthAndYear(
                user.getUserId(), startDate.getMonthValue(), startDate.getYear());

        List<Pocket> pockets = new ArrayList<>();
        if (budgetOpt.isPresent()) {
            pockets = pocketRepository.findByBudgetBudgetId(budgetOpt.get().getBudgetId());
        }

        // Prepare JSON payload for the prompt
        Map<String, Object> userData = new HashMap<>();
        List<Map<String, Object>> expenseList = expenses.stream().map(e -> {
            Map<String, Object> map = new HashMap<>();
            if (e.getCategory() != null)
                map.put("category", e.getCategory().getTitle());
            map.put("amount", e.getAmount());
            map.put("date", e.getDate().toString());
            map.put("description", e.getDescription());
            return map;
        }).collect(Collectors.toList());

        userData.put("gastos", expenseList);
        budgetOpt.ifPresent(budget -> userData.put("presupuestoTotal", budget.getTotalAmount()));

        List<Map<String, Object>> pocketList = pockets.stream().map(p -> {
            Map<String, Object> map = new HashMap<>();
            map.put("title", p.getTitle());
            map.put("allocatedAmount", p.getAllocatedAmount());
            map.put("currentAmount", p.getCurrentAmount());
            if (p.getCategory() != null)
                map.put("category", p.getCategory().getTitle());
            return map;
        }).collect(Collectors.toList());
        userData.put("bolsillos", pocketList);

        String userDataJson;
        try {
            userDataJson = objectMapper.writeValueAsString(userData);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Error serializing user data");
        }

        String prompt = "Eres un asesor financiero experto. Analiza los siguientes datos financieros de un usuario para el mes de "
                + month + " y devuelve un arreglo JSON estricto con recomendaciones de ahorro personalizadas. " +
                "Los datos incluyen gastos realizados ('gastos'), el presupuesto total del mes ('presupuestoTotal') y los bolsillos o límites por categoría ('bolsillos'). "
                +
                "Cada objeto del arreglo JSON debe tener exactamente esta estructura: {\"category\": \"Nombre de la categoría principal afectada (ej. Alimentación, Transporte, etc.)\", \"motivo\": \"Explicación detallada de por qué y cómo ahorrar en esta categoría basándote estrictamente en los datos enviados\", \"ahorroEstimado\": número entero que representa el monto de ahorro sugerido en la moneda local (COP)}. "
                +
                "Datos del usuario: " + userDataJson + ". " +
                "Devuelve únicamente el arreglo JSON, sin texto adicional ni marcadores markdown. Asegúrate de que sea un JSON válido y conciso.";

        try {
            Map<String, Object> requestBody = new HashMap<>();
            Map<String, Object> content = new HashMap<>();
            Map<String, Object> part = new HashMap<>();
            part.put("text", prompt);
            content.put("parts", List.of(part));
            requestBody.put("contents", List.of(content));

            Map<String, Object> generationConfig = new HashMap<>();
            generationConfig.put("temperature", 0.7);
            generationConfig.put("topK", 40);
            generationConfig.put("topP", 0.95);
            generationConfig.put("maxOutputTokens", 1024);
            requestBody.put("generationConfig", generationConfig);

            String requestBodyJson = objectMapper.writeValueAsString(requestBody);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(getGeminiApiUrl()))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBodyJson))
                    .build();
            logger.info("Enviando petición a Gemini para usuario: {}", user.getEmail());
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            logger.info("Respuesta de Gemini recibida. Status: {}", response.statusCode());

            if (response.statusCode() != 200) {
                logger.error("Error de Gemini: {}", response.body());
                throw new RuntimeException("Error from Gemini API: " + response.body());
            }

            // Parse response
            Map<String, Object> responseBody = objectMapper.readValue(response.body(), new TypeReference<>() {
            });
            List<Map<String, Object>> candidates = (List<Map<String, Object>>) responseBody.get("candidates");

            if (candidates == null || candidates.isEmpty()) {
                throw new RuntimeException("No candidates in Gemini response: " + response.body());
            }

            Map<String, Object> candidate = candidates.get(0);
            Map<String, Object> contentMap = (Map<String, Object>) candidate.get("content");
            List<Map<String, Object>> parts = (List<Map<String, Object>>) contentMap.get("parts");
            String text = (String) parts.get(0).get("text");

            // Clean markdown if present
            if (text.contains("```json")) {
                text = text.substring(text.indexOf("```json") + 7);
                if (text.contains("```")) {
                    text = text.substring(0, text.indexOf("```"));
                }
            } else if (text.contains("```")) {
                text = text.substring(text.indexOf("```") + 3);
                if (text.contains("```")) {
                    text = text.substring(0, text.indexOf("```"));
                }
            }
            text = text.trim();

            return objectMapper.readValue(text, new TypeReference<List<AiRecommendationResponse>>() {
            });

        } catch (Exception e) {
            logger.error("Error generando recomendaciones: {}", e.getMessage(), e);
            throw new RuntimeException("Error generating recommendations: " + e.getMessage());
        }
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
    }
}
