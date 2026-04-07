package com.finanzas.api.controller;

import com.finanzas.api.dto.request.PocketRequest;
import com.finanzas.api.dto.response.PocketResponse;
import com.finanzas.api.service.PocketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/pockets")
@RequiredArgsConstructor
public class PocketController {

    private final PocketService pocketService;

    @GetMapping
    public ResponseEntity<List<PocketResponse>> getAll() {
        return ResponseEntity.ok(pocketService.getMyPockets());
    }

    @GetMapping("/budget/{budgetId}")
    public ResponseEntity<List<PocketResponse>> getByBudget(@PathVariable UUID budgetId) {
        return ResponseEntity.ok(pocketService.getPocketsByBudget(budgetId));
    }

    @PostMapping
    public ResponseEntity<PocketResponse> create(@Valid @RequestBody PocketRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(pocketService.create(request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        pocketService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
