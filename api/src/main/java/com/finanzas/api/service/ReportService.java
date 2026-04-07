package com.finanzas.api.service;

import com.finanzas.api.dto.response.ReportResponse;
import com.finanzas.api.dto.response.TransactionResponse;
import com.finanzas.api.model.Transaction;
import com.finanzas.api.model.User;
import com.finanzas.api.repository.TransactionRepository;
import com.finanzas.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;

    public ReportResponse generate(LocalDate start, LocalDate end) {
        UUID userId = getCurrentUser().getUserId();

        List<Transaction> all = transactionRepository
            .findByUserUserIdAndDateBetweenOrderByDateDesc(userId, start, end);

        BigDecimal totalIncome = all.stream()
            .filter(t -> t.getCategory() != null && "INCOME".equals(t.getCategory().getType()))
            .filter(t -> "COMPLETED".equals(t.getStatus()))
            .map(Transaction::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalExpense = all.stream()
            .filter(t -> t.getCategory() != null && "EXPENSE".equals(t.getCategory().getType()))
            .filter(t -> "COMPLETED".equals(t.getStatus()))
            .map(Transaction::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, BigDecimal> expenseByCategory = all.stream()
            .filter(t -> t.getCategory() != null && "EXPENSE".equals(t.getCategory().getType()))
            .filter(t -> "COMPLETED".equals(t.getStatus()))
            .collect(Collectors.groupingBy(
                t -> t.getCategory().getTitle(),
                Collectors.reducing(BigDecimal.ZERO, Transaction::getAmount, BigDecimal::add)
            ));

        Map<String, BigDecimal> incomeByCategory = all.stream()
            .filter(t -> t.getCategory() != null && "INCOME".equals(t.getCategory().getType()))
            .filter(t -> "COMPLETED".equals(t.getStatus()))
            .collect(Collectors.groupingBy(
                t -> t.getCategory().getTitle(),
                Collectors.reducing(BigDecimal.ZERO, Transaction::getAmount, BigDecimal::add)
            ));

        List<TransactionResponse> transactions = all.stream()
            .map(this::toResponse).toList();

        ReportResponse report = new ReportResponse();
        report.setStartDate(start);
        report.setEndDate(end);
        report.setTotalIncome(totalIncome);
        report.setTotalExpense(totalExpense);
        report.setBalance(totalIncome.subtract(totalExpense));
        report.setExpenseByCategory(expenseByCategory);
        report.setIncomeByCategory(incomeByCategory);
        report.setTransactions(transactions);
        return report;
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
}
