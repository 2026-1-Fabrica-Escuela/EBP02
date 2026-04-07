package com.finanzas.api.repository;

import com.finanzas.api.model.AiAdvice;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface AiAdviceRepository extends JpaRepository<AiAdvice, UUID> {
    List<AiAdvice> findByUserUserIdOrderByCreatedAtDesc(UUID userId);
    List<AiAdvice> findByUserUserIdAndRead(UUID userId, Boolean read);
}
