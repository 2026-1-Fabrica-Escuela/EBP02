package com.finanzas.api.model;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "al_advices")
@Data
public class AiAdvice {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "al_advice_id")
    private UUID alAdviceId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "message", nullable = false, columnDefinition = "text")
    private String message;

    @Column(name = "read", nullable = false)
    private Boolean read = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
