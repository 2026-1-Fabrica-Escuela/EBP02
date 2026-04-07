package com.finanzas.api.controller;

import com.finanzas.api.dto.request.LoginRequest;
import com.finanzas.api.dto.request.RegisterRequest;
import com.finanzas.api.dto.response.AuthResponse;
import com.finanzas.api.repository.UserRepository;
import com.finanzas.api.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication; // Para el objeto Authentication
import org.springframework.http.HttpStatus;              // Para HttpStatus.UNAUTHORIZED
import com.finanzas.api.model.User;                      // Reemplaza con la ruta real de tu entidad User
import com.finanzas.api.service.AuthService;            // Necesitaremos esto para buscar al usuario

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String email = authentication.getName();

        // Usamos el repositorio directamente, que ya tiene el método findByEmail
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        // Extraemos el nombre del rol (asumiendo que tu entidad Role tiene getNombre())
        String roleName = user.getRole() != null ? user.getRole().getNombre() : "USER";

        // Devolvemos el AuthResponse (recuerda que el primer parámetro es el token, lo mandamos null)
        return ResponseEntity.ok(new AuthResponse(
            null,
            user.getUserId(),
            user.getNombre(),
            user.getEmail(),
            roleName
        ));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        return ResponseEntity.ok().body("Sesión cerrada exitosamente");
    }
}

