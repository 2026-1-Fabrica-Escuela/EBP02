package com.finanzas.api.controller;

import com.finanzas.api.dto.request.ForgotPasswordRequest;
import com.finanzas.api.dto.request.LoginRequest;
import com.finanzas.api.dto.request.RegisterRequest;
import com.finanzas.api.dto.request.ResetPasswordRequest;
import com.finanzas.api.dto.request.UserUpdateRequest;
import com.finanzas.api.dto.response.AuthResponse;
import com.finanzas.api.dto.response.MessageResponse;
import com.finanzas.api.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/me")
    public ResponseEntity<AuthResponse> getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(authService.getCurrentUser(email));
    }

    @PutMapping({"/me", "/profile"})
    public ResponseEntity<AuthResponse> updateMyProfile(@RequestBody UserUpdateRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(authService.updateMyProfile(email, request.getName(), request.getEmail()));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        return ResponseEntity.noContent().build();
    }

    // C2-C4: Solicitar enlace de restablecimiento
    @PostMapping("/forgot-password")
    public ResponseEntity<MessageResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request.getEmail());
        return ResponseEntity.ok(new MessageResponse(
            "Te enviamos un enlace a tu correo para restablecer tu contraseña"));
    }

    // C5-C6: Aplicar nueva contraseña
    @PostMapping("/reset-password")
    public ResponseEntity<MessageResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request.getToken(), request.getNewPassword());
        return ResponseEntity.ok(new MessageResponse("Tu contraseña fue restablecida con éxito"));
    }
}
