package com.finanzas.api.model;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "login_logs")
@Data
public class LoginLog {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID loginLogId;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private String userName;
    private String userEmail;

    @CreationTimestamp
    @Column(name = "timestamp", updatable = false)
    private LocalDateTime timestamp;
}
