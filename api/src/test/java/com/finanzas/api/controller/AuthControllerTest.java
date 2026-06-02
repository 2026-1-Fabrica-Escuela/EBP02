package com.finanzas.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.finanzas.api.dto.response.AuthResponse;
import com.finanzas.api.service.AuthService;
import com.finanzas.api.service.EmailService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
class AuthControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @MockitoBean AuthService authService;
    @MockitoBean EmailService emailService;
    @MockitoBean com.finanzas.api.security.JwtUtil jwtUtil;
    @MockitoBean org.springframework.security.core.userdetails.UserDetailsService userDetailsService;

    // ─── HU-18 C2: email vacío → validación Bean (422) ───────────────────────

    @Test
    void forgotPassword_emptyEmail_returns422() throws Exception {
        mockMvc.perform(post("/api/auth/forgot-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("email", ""))))
            .andExpect(status().isUnprocessableEntity());
    }

    // ─── HU-18 C2: email con formato inválido → 422 ───────────────────────────

    @Test
    void forgotPassword_invalidEmailFormat_returns422() throws Exception {
        mockMvc.perform(post("/api/auth/forgot-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("email", "no-es-email"))))
            .andExpect(status().isUnprocessableEntity());
    }

    // ─── HU-18 C3: email no registrado → 400 ─────────────────────────────────

    @Test
    void forgotPassword_emailNotFound_returns400() throws Exception {
        doThrow(new RuntimeException("No existe una cuenta asociada a este correo electrónico"))
            .when(authService).forgotPassword(anyString());

        mockMvc.perform(post("/api/auth/forgot-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("email", "noexiste@test.com"))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("No existe una cuenta asociada a este correo electrónico"));
    }

    // ─── HU-18 C4: email válido y registrado → 200 ───────────────────────────

    @Test
    void forgotPassword_validEmail_returns200() throws Exception {
        doNothing().when(authService).forgotPassword(anyString());

        mockMvc.perform(post("/api/auth/forgot-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("email", "usuario@test.com"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.message").value("Te enviamos un enlace a tu correo para restablecer tu contraseña"));
    }

    // ─── HU-18 C5: token inválido → 400 ──────────────────────────────────────

    @Test
    void resetPassword_invalidToken_returns400() throws Exception {
        doThrow(new RuntimeException("Token de restablecimiento inválido o expirado"))
            .when(authService).resetPassword(anyString(), anyString());

        mockMvc.perform(post("/api/auth/reset-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                    Map.of("token", "token-invalido", "newPassword", "NuevaPass1"))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Token de restablecimiento inválido o expirado"));
    }

    // ─── HU-18 C5: contraseña débil (sin mayúscula o sin número) → 422 ───────

    @Test
    void resetPassword_weakPassword_returns422() throws Exception {
        mockMvc.perform(post("/api/auth/reset-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                    Map.of("token", "tok", "newPassword", "debil"))))
            .andExpect(status().isUnprocessableEntity());
    }

    // ─── HU-18 C6: restablecimiento exitoso → 200 ────────────────────────────

    @Test
    void resetPassword_valid_returns200() throws Exception {
        doNothing().when(authService).resetPassword(anyString(), anyString());

        mockMvc.perform(post("/api/auth/reset-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                    Map.of("token", "token-valido", "newPassword", "NuevaPass1"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.message").value("Tu contraseña fue restablecida con éxito"));
    }

    // ─── HU-16 C2: actualización de perfil válida → 200 ──────────────────────

    @Test
    @WithMockUser(username = "usuario@test.com")
    void updateProfile_validData_returns200() throws Exception {
        AuthResponse response = new AuthResponse(null, UUID.randomUUID(), "Nuevo Nombre", "nuevo@test.com", "USER");
        when(authService.updateMyProfile(anyString(), anyString(), anyString())).thenReturn(response);

        mockMvc.perform(put("/api/auth/profile")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("name", "Nuevo Nombre", "email", "nuevo@test.com"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.nombre").value("Nuevo Nombre"))
            .andExpect(jsonPath("$.email").value("nuevo@test.com"));
    }

    // ─── HU-16 C3: campos vacíos → 400 ───────────────────────────────────────

    @Test
    @WithMockUser(username = "usuario@test.com")
    void updateProfile_emptyName_returns400() throws Exception {
        doThrow(new RuntimeException("Por favor, completa todos los campos obligatorios"))
            .when(authService).updateMyProfile(anyString(), eq(""), anyString());

        mockMvc.perform(put("/api/auth/profile")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("name", "", "email", "usuario@test.com"))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Por favor, completa todos los campos obligatorios"));
    }

    // ─── HU-16 C4: correo inválido → 400 ─────────────────────────────────────

    @Test
    @WithMockUser(username = "usuario@test.com")
    void updateProfile_invalidEmail_returns400() throws Exception {
        doThrow(new RuntimeException("Ingresa un correo electrónico válido"))
            .when(authService).updateMyProfile(anyString(), anyString(), eq("correo-invalido"));

        mockMvc.perform(put("/api/auth/profile")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("name", "Nombre", "email", "correo-invalido"))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Ingresa un correo electrónico válido"));
    }
}
