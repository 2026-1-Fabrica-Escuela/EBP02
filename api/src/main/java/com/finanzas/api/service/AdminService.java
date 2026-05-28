package com.finanzas.api.service;

import com.finanzas.api.model.LoginLog;
import com.finanzas.api.model.User;
import com.finanzas.api.repository.LoginLogRepository;
import com.finanzas.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminService {
    private final UserRepository userRepository;
    private final LoginLogRepository loginLogRepository;

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @Transactional
    public User suspendUser(UUID userId, String reason) {
        System.out.println("Searching for user to suspend with ID: " + userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        user.setStatus("suspendida");
        user.setSuspendReason(reason);
        return userRepository.save(user);
    }

    @Transactional
    public User activateUser(UUID userId) {
        System.out.println("Searching for user to activate with ID: " + userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        user.setStatus("activa");
        user.setSuspendReason(null);
        return userRepository.save(user);
    }

    @Transactional
    public User updateUser(UUID userId, String name, String email) {
        System.out.println("Searching for user to update with ID: " + userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        user.setNombre(name);
        user.setEmail(email);
        return userRepository.save(user);
    }

    public User getUserById(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
    }

    public List<LoginLog> getLoginLogs(LocalDateTime start, LocalDateTime end) {
        return loginLogRepository.findByTimestampBetweenOrderByTimestampDesc(start, end);
    }
}
