package com.finanzas.api.controller;

import com.finanzas.api.dto.request.SuspendRequest;
import com.finanzas.api.dto.request.UserUpdateRequest;
import com.finanzas.api.dto.response.LoginLogResponse;
import com.finanzas.api.dto.response.UserResponse;
import com.finanzas.api.model.User;
import com.finanzas.api.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(adminService.getAllUsers().stream()
                .map(this::convertToUserResponse)
                .collect(Collectors.toList()));
    }

    @PatchMapping("/users/{userId}/suspend")
    public ResponseEntity<UserResponse> suspendUser(@PathVariable UUID userId, @RequestBody SuspendRequest request) {
        return ResponseEntity.ok(convertToUserResponse(adminService.suspendUser(userId, request.getReason())));
    }

    @PatchMapping("/users/{userId}/activate")
    public ResponseEntity<UserResponse> activateUser(@PathVariable UUID userId) {
        return ResponseEntity.ok(convertToUserResponse(adminService.activateUser(userId)));
    }

    @PutMapping("/users/{userId}")
    public ResponseEntity<UserResponse> updateUser(@PathVariable UUID userId, @RequestBody UserUpdateRequest request) {
        return ResponseEntity.ok(convertToUserResponse(adminService.updateUser(userId, request.getName(), request.getEmail())));
    }

    @GetMapping("/users/{userId}")
    public ResponseEntity<UserResponse> getUser(@PathVariable UUID userId) {
        return ResponseEntity.ok(convertToUserResponse(adminService.getUserById(userId)));
    }

    @GetMapping("/login-logs")
    public ResponseEntity<List<LoginLogResponse>> getLoginLogs(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        
        LocalDateTime startDateTime = start.atStartOfDay();
        LocalDateTime endDateTime = end.atTime(LocalTime.MAX);
        
        return ResponseEntity.ok(adminService.getLoginLogs(startDateTime, endDateTime).stream()
                .map(log -> {
                    LoginLogResponse res = new LoginLogResponse();
                    res.setLoginLogId(log.getLoginLogId());
                    res.setUserId(log.getUser().getUserId());
                    res.setUserName(log.getUserName());
                    res.setUserEmail(log.getUserEmail());
                    res.setTimestamp(log.getTimestamp());
                    return res;
                })
                .collect(Collectors.toList()));
    }

    private UserResponse convertToUserResponse(User user) {
        UserResponse res = new UserResponse();
        res.setId(user.getUserId());
        res.setName(user.getNombre());
        res.setEmail(user.getEmail());
        res.setRole(user.getRole() != null ? user.getRole().getNombre() : "USER");
        res.setStatus(user.getStatus());
        res.setSuspendReason(user.getSuspendReason());
        return res;
    }
}
