package com.finanzas.api.repository;

import com.finanzas.api.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface TransactionRepository extends JpaRepository<Transaction, UUID> {

    List<Transaction> findByUserUserIdOrderByDateDesc(UUID userId);

    List<Transaction> findByUserUserIdAndDateBetweenOrderByDateDesc(
        UUID userId, LocalDate startDate, LocalDate endDate
    );

    List<Transaction> findByUserUserIdAndCategoryCategoryIdOrderByDateDesc(
        UUID userId, UUID categoryId
    );

    @Query("""
        SELECT t FROM Transaction t
        WHERE t.user.userId = :userId
        AND t.category.type = :type
        AND t.date BETWEEN :start AND :end
        ORDER BY t.date DESC
    """)
    List<Transaction> findByUserAndTypeAndPeriod(
        @Param("userId") UUID userId,
        @Param("type") String type,
        @Param("start") LocalDate start,
        @Param("end") LocalDate end
    );
}
