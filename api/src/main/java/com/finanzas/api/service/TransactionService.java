package com.finanzas.api.service;

import com.finanzas.api.dto.request.TransactionRequest;
import com.finanzas.api.dto.response.TransactionResponse;
import com.finanzas.api.model.*;
import com.finanzas.api.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final CategoryRepository categoryRepository;
    private final PocketRepository pocketRepository;
    private final UserRepository userRepository;

    public List<TransactionResponse> getMyTransactions() {
        UUID userId = getCurrentUser().getUserId();
        return transactionRepository.findByUserUserIdOrderByDateDesc(userId)
            .stream().map(this::toResponse).toList();
    }

    public List<TransactionResponse> getByPeriod(LocalDate start, LocalDate end) {
        UUID userId = getCurrentUser().getUserId();
        return transactionRepository
            .findByUserUserIdAndDateBetweenOrderByDateDesc(userId, start, end)
            .stream().map(this::toResponse).toList();
    }

    @Transactional
    public TransactionResponse create(TransactionRequest request) {
        User user = getCurrentUser();

        Category category = categoryRepository.findById(request.getCategoryId())
            .orElseThrow(() -> new RuntimeException("Categoría no encontrada"));

        Transaction transaction = new Transaction();
        transaction.setUser(user);
        transaction.setCategory(category);
        transaction.setAmount(request.getAmount());
        transaction.setDescription(request.getDescription());
        transaction.setStatus(request.getStatus());
        transaction.setDate(request.getDate());

        // Si tiene pocket, descontar el saldo del bolsillo
        if (request.getPocketId() != null) {
            Pocket pocket = pocketRepository.findById(request.getPocketId())
                .orElseThrow(() -> new RuntimeException("Bolsillo no encontrado"));

            if (!pocket.getIsSavings() && category.getType().equals("EXPENSE")) {
                pocket.setCurrentAmount(pocket.getCurrentAmount().subtract(request.getAmount()));
                pocketRepository.save(pocket);
            }
            transaction.setPocket(pocket);
        }

        return toResponse(transactionRepository.save(transaction));
    }

    @Transactional
    public TransactionResponse updateStatus(UUID id, String status) {
        Transaction transaction = transactionRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Transacción no encontrada"));
        validateOwnership(transaction.getUser().getUserId());
        transaction.setStatus(status);
        return toResponse(transactionRepository.save(transaction));
    }

    public void delete(UUID id) {
        Transaction transaction = transactionRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Transacción no encontrada"));
        validateOwnership(transaction.getUser().getUserId());
        transactionRepository.delete(transaction);
    }

    private TransactionResponse toResponse(Transaction t) {
        TransactionResponse r = new TransactionResponse();
        r.setTransactionId(t.getTransactionId());
        r.setAmount(t.getAmount());
        r.setDescription(t.getDescription());
        r.setStatus(t.getStatus());
        r.setDate(t.getDate());
        if (t.getCategory() != null) {
            r.setCategoryTitle(t.getCategory().getTitle());
            r.setCategoryType(t.getCategory().getType());
        }
        if (t.getPocket() != null) {
            r.setPocketTitle(t.getPocket().getTitle());
        }
        return r;
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
    }

    private void validateOwnership(UUID ownerId) {
        if (!getCurrentUser().getUserId().equals(ownerId)) {
            throw new RuntimeException("No tienes permiso para esta acción");
        }
    }
}
