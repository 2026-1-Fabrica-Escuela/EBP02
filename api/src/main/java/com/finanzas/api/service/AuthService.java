package com.finanzas.api.service;

import com.finanzas.api.dto.request.LoginRequest;
import com.finanzas.api.dto.request.RegisterRequest;
import com.finanzas.api.dto.response.AuthResponse;
import com.finanzas.api.model.Role;
import com.finanzas.api.model.User;
import com.finanzas.api.repository.RoleRepository;
import com.finanzas.api.repository.UserRepository;
import com.finanzas.api.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authManager;
    private final com.finanzas.api.repository.LoginLogRepository loginLogRepository;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("El email ya está registrado");
        }

        Role role = roleRepository.findByNombre("USER")
            .orElseThrow(() -> new RuntimeException("Rol USER no encontrado"));

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setNombre(request.getNombre());
        user.setRole(role);
        user.setStatus("activa");

        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getEmail());
        return new AuthResponse(token, user.getUserId(), user.getNombre(), user.getEmail(), "USER");
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        if ("suspendida".equalsIgnoreCase(user.getStatus())) {
            throw new RuntimeException("Tu cuenta ha sido suspendida. Motivo: " + user.getSuspendReason());
        }

        authManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        // Record Login Log
        com.finanzas.api.model.LoginLog log = new com.finanzas.api.model.LoginLog();
        log.setUser(user);
        log.setUserName(user.getNombre());
        log.setUserEmail(user.getEmail());
        loginLogRepository.save(log);

        String token = jwtUtil.generateToken(user.getEmail());
        String roleName = user.getRole() != null ? user.getRole().getNombre() : "USER";

        return new AuthResponse(token, user.getUserId(), user.getNombre(), user.getEmail(), roleName);
    }
    public AuthResponse getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        
        String roleName = user.getRole() != null ? user.getRole().getNombre() : "USER";
        return new AuthResponse(null, user.getUserId(), user.getNombre(), user.getEmail(), roleName);
    }
}
