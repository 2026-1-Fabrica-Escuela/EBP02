package com.finanzas.api.controller;

import com.finanzas.api.dto.request.BudgetRequest;
import com.finanzas.api.dto.response.BudgetResponse;
import com.finanzas.api.service.BudgetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/budgets")
@RequiredArgsConstructor
public class BudgetController {

    private final BudgetService budgetService;

    @GetMapping
    public ResponseEntity<List<BudgetResponse>> getAll() {
        return ResponseEntity.ok(budgetService.getMyBudgets());
    }

    @GetMapping("/{month}/{year}")
    public ResponseEntity<BudgetResponse> getByMonthYear(@PathVariable Integer month,
                                                         @PathVariable Integer year) {
        return ResponseEntity.ok(budgetService.getByMonthAndYear(month, year));
    }

    @PostMapping
    public ResponseEntity<BudgetResponse> create(@Valid @RequestBody BudgetRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(budgetService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BudgetResponse> update(@PathVariable UUID id,
                                                 @Valid @RequestBody BudgetRequest request) {
        return ResponseEntity.ok(budgetService.update(id, request));
    }
}
