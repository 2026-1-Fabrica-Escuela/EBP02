package com.finanzas.api.service;

import com.finanzas.api.model.Role;
import com.finanzas.api.model.User;
import com.finanzas.api.repository.LoginLogRepository;
import com.finanzas.api.repository.RoleRepository;
import com.finanzas.api.repository.UserRepository;
import com.finanzas.api.security.JwtUtil;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import com.finanzas.api.service.EmailService;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private RoleRepository roleRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtUtil jwtUtil;
    @Mock private AuthenticationManager authManager;
    @Mock private LoginLogRepository loginLogRepository;
    @Mock private EmailService emailService;

    @InjectMocks
    private AuthService authService;

    // ─── HU-18 C3: correo no registrado ───────────────────────────────────────

    @Test
    void forgotPassword_emailNotFound_throwsException() {
        when(userRepository.findByEmail("noexiste@test.com")).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class,
            () -> authService.forgotPassword("noexiste@test.com"));

        assertEquals("No existe una cuenta asociada a este correo electrónico", ex.getMessage());
    }

    // ─── HU-18 C4: correo válido y registrado → genera token y envía correo ──

    @Test
    void forgotPassword_validEmail_savesTokenAndSendsEmail() {
        User user = buildUser();
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));
        doNothing().when(emailService).sendPasswordResetEmail(anyString(), anyString());

        authService.forgotPassword(user.getEmail());

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        User saved = captor.getValue();
        assertNotNull(saved.getResetToken());
        assertFalse(saved.getResetToken().isBlank());
        assertNotNull(saved.getResetTokenExpiresAt());
        assertTrue(saved.getResetTokenExpiresAt().isAfter(LocalDateTime.now()));

        verify(emailService).sendPasswordResetEmail(eq(user.getEmail()), anyString());
    }

    // ─── HU-18 C5: token inválido o expirado ─────────────────────────────────

    @Test
    void resetPassword_invalidToken_throwsException() {
        when(userRepository.findByResetToken("token-invalido")).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class,
            () -> authService.resetPassword("token-invalido", "NuevaPass1"));

        assertEquals("Token de restablecimiento inválido o expirado", ex.getMessage());
    }

    @Test
    void resetPassword_expiredToken_throwsException() {
        User user = buildUser();
        user.setResetToken("token-expirado");
        user.setResetTokenExpiresAt(LocalDateTime.now().minusMinutes(5));
        when(userRepository.findByResetToken("token-expirado")).thenReturn(Optional.of(user));

        RuntimeException ex = assertThrows(RuntimeException.class,
            () -> authService.resetPassword("token-expirado", "NuevaPass1"));

        assertEquals("Token de restablecimiento inválido o expirado", ex.getMessage());
    }

    // ─── HU-18 C5: contraseña no cumple requisitos ───────────────────────────
    // La validación del patrón ocurre en el DTO (@Pattern); el service recibe la
    // contraseña ya validada. Este test verifica que el service sí la codifica.

    // ─── HU-18 C6: contraseña válida → actualiza y limpia token ──────────────

    @Test
    void resetPassword_validToken_updatesPasswordAndClearsToken() {
        User user = buildUser();
        user.setResetToken("token-valido");
        user.setResetTokenExpiresAt(LocalDateTime.now().plusMinutes(20));
        when(userRepository.findByResetToken("token-valido")).thenReturn(Optional.of(user));
        when(passwordEncoder.encode("NuevaPass1")).thenReturn("encoded-pass");
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        authService.resetPassword("token-valido", "NuevaPass1");

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        User saved = captor.getValue();
        assertEquals("encoded-pass", saved.getPasswordHash());
        assertNull(saved.getResetToken());
        assertNull(saved.getResetTokenExpiresAt());
    }

    // ─── HU-16 C2: actualización válida de perfil ────────────────────────────

    @Test
    void updateMyProfile_validData_updatesUserAndReturnsResponse() {
        User user = buildUser();
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(userRepository.existsByEmail("nuevo@test.com")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        var response = authService.updateMyProfile(user.getEmail(), "Nuevo Nombre", "nuevo@test.com");

        assertNotNull(response);
        assertEquals("Nuevo Nombre", response.getNombre());
        assertEquals("nuevo@test.com", response.getEmail());
    }

    // ─── HU-16 C3: campos vacíos ──────────────────────────────────────────────

    @Test
    void updateMyProfile_emptyName_throwsException() {
        User user = buildUser();
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));

        RuntimeException ex = assertThrows(RuntimeException.class,
            () -> authService.updateMyProfile(user.getEmail(), "", "nuevo@test.com"));

        assertEquals("Por favor, completa todos los campos obligatorios", ex.getMessage());
    }

    @Test
    void updateMyProfile_emptyEmail_throwsException() {
        User user = buildUser();
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));

        RuntimeException ex = assertThrows(RuntimeException.class,
            () -> authService.updateMyProfile(user.getEmail(), "Nombre", ""));

        assertEquals("Por favor, completa todos los campos obligatorios", ex.getMessage());
    }

    // ─── HU-16 C4: email con formato inválido ────────────────────────────────

    @Test
    void updateMyProfile_invalidEmailFormat_throwsException() {
        User user = buildUser();
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));

        RuntimeException ex = assertThrows(RuntimeException.class,
            () -> authService.updateMyProfile(user.getEmail(), "Nombre", "correo-invalido"));

        assertEquals("Ingresa un correo electrónico válido", ex.getMessage());
    }

    // ─── helpers ─────────────────────────────────────────────────────────────

    private User buildUser() {
        Role role = new Role();
        role.setNombre("USER");

        User user = new User();
        user.setUserId(UUID.randomUUID());
        user.setEmail("usuario@test.com");
        user.setNombre("Usuario Test");
        user.setPasswordHash("hash");
        user.setRole(role);
        user.setStatus("activa");
        return user;
    }
}
