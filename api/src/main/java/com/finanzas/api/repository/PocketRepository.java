package com.finanzas.api.repository;

import com.finanzas.api.model.Pocket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface PocketRepository extends JpaRepository<Pocket, UUID> {
    List<Pocket> findByUserUserId(UUID userId);
    List<Pocket> findByBudgetBudgetId(UUID budgetId);

    @Query("SELECT COALESCE(SUM(p.allocatedAmount), 0) FROM Pocket p WHERE p.budget.budgetId = :budgetId")
    BigDecimal sumAllocatedByBudget(@Param("budgetId") UUID budgetId);
}
