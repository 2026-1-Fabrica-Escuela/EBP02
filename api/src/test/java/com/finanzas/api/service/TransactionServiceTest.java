package com.finanzas.api.service;

import com.finanzas.api.dto.request.TransactionRequest;
import com.finanzas.api.dto.response.TransactionResponse;
import com.finanzas.api.model.*;
import com.finanzas.api.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class TransactionServiceTest {

    @Mock private TransactionRepository transactionRepository;
    @Mock private CategoryRepository categoryRepository;
    @Mock private PocketRepository pocketRepository;
    @Mock private UserRepository userRepository;
    @Mock private SecurityContext securityContext;
    @Mock private Authentication authentication;

    @InjectMocks
    private TransactionService transactionService;

    private User currentUser;
    private UUID userId;
    private UUID transactionId;
    private UUID categoryId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        transactionId = UUID.randomUUID();
        categoryId = UUID.randomUUID();

        currentUser = new User();
        currentUser.setUserId(userId);
        currentUser.setEmail("usuario@test.com");

        SecurityContextHolder.setContext(securityContext);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn("usuario@test.com");
        when(userRepository.findByEmail("usuario@test.com")).thenReturn(Optional.of(currentUser));
    }

    // ─── HU-09 C1: obtener transacción por id (formulario precargado) ─────────

    @Test
    void getById_existingTransaction_returnsResponse() {
        Transaction t = buildTransaction();
        when(transactionRepository.findById(transactionId)).thenReturn(Optional.of(t));

        TransactionResponse response = transactionService.getById(transactionId);

        assertNotNull(response);
        assertEquals(transactionId, response.getTransactionId());
        assertEquals(new BigDecimal("100.00"), response.getAmount());
    }

    @Test
    void getById_notFound_throwsException() {
        when(transactionRepository.findById(transactionId)).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class,
            () -> transactionService.getById(transactionId));

        assertEquals("Transacción no encontrada", ex.getMessage());
    }

    @Test
    void getById_ownershipViolation_throwsException() {
        User otherUser = new User();
        otherUser.setUserId(UUID.randomUUID());

        Transaction t = buildTransaction();
        t.setUser(otherUser);
        when(transactionRepository.findById(transactionId)).thenReturn(Optional.of(t));

        assertThrows(RuntimeException.class, () -> transactionService.getById(transactionId));
    }

    // ─── HU-09 C2: campos obligatorios vacíos ────────────────────────────────

    @Test
    void update_missingCategory_throwsException() {
        Transaction t = buildTransaction();
        when(transactionRepository.findById(transactionId)).thenReturn(Optional.of(t));

        TransactionRequest req = buildRequest();
        req.setCategoryId(null);

        RuntimeException ex = assertThrows(RuntimeException.class,
            () -> transactionService.update(transactionId, req));

        assertEquals("Por favor, completa todos los campos obligatorios", ex.getMessage());
    }

    @Test
    void update_missingDate_throwsException() {
        Transaction t = buildTransaction();
        when(transactionRepository.findById(transactionId)).thenReturn(Optional.of(t));

        TransactionRequest req = buildRequest();
        req.setDate(null);

        RuntimeException ex = assertThrows(RuntimeException.class,
            () -> transactionService.update(transactionId, req));

        assertEquals("Por favor, completa todos los campos obligatorios", ex.getMessage());
    }

    // ─── HU-09 C3: monto inválido ────────────────────────────────────────────

    @Test
    void update_zeroAmount_throwsException() {
        Transaction t = buildTransaction();
        when(transactionRepository.findById(transactionId)).thenReturn(Optional.of(t));

        TransactionRequest req = buildRequest();
        req.setAmount(BigDecimal.ZERO);

        RuntimeException ex = assertThrows(RuntimeException.class,
            () -> transactionService.update(transactionId, req));

        assertEquals("El monto debe ser un valor numérico mayor a cero", ex.getMessage());
    }

    @Test
    void update_negativeAmount_throwsException() {
        Transaction t = buildTransaction();
        when(transactionRepository.findById(transactionId)).thenReturn(Optional.of(t));

        TransactionRequest req = buildRequest();
        req.setAmount(new BigDecimal("-50.00"));

        RuntimeException ex = assertThrows(RuntimeException.class,
            () -> transactionService.update(transactionId, req));

        assertEquals("El monto debe ser un valor numérico mayor a cero", ex.getMessage());
    }

    // ─── HU-09 C4: actualización válida ──────────────────────────────────────

    @Test
    void update_validData_returnsUpdatedResponse() {
        Transaction t = buildTransaction();
        when(transactionRepository.findById(transactionId)).thenReturn(Optional.of(t));

        Category category = buildCategory();
        when(categoryRepository.findById(categoryId)).thenReturn(Optional.of(category));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(i -> i.getArgument(0));

        TransactionRequest req = buildRequest();
        req.setAmount(new BigDecimal("250.00"));
        req.setDescription("Descripción actualizada");

        TransactionResponse response = transactionService.update(transactionId, req);

        assertNotNull(response);
        assertEquals(new BigDecimal("250.00"), response.getAmount());
        assertEquals("Descripción actualizada", response.getDescription());
    }

    // ─── HU-10 C3: eliminar transacción ──────────────────────────────────────

    @Test
    void delete_existingTransaction_deletesSuccessfully() {
        Transaction t = buildTransaction();
        when(transactionRepository.findById(transactionId)).thenReturn(Optional.of(t));

        assertDoesNotThrow(() -> transactionService.delete(transactionId));
        verify(transactionRepository).delete(t);
    }

    @Test
    void delete_notFound_throwsException() {
        when(transactionRepository.findById(transactionId)).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class,
            () -> transactionService.delete(transactionId));

        assertEquals("Transacción no encontrada", ex.getMessage());
        verify(transactionRepository, never()).delete(any());
    }

    @Test
    void delete_ownershipViolation_throwsException() {
        User otherUser = new User();
        otherUser.setUserId(UUID.randomUUID());

        Transaction t = buildTransaction();
        t.setUser(otherUser);
        when(transactionRepository.findById(transactionId)).thenReturn(Optional.of(t));

        assertThrows(RuntimeException.class, () -> transactionService.delete(transactionId));
        verify(transactionRepository, never()).delete(any());
    }

    // ─── helpers ─────────────────────────────────────────────────────────────

    private Transaction buildTransaction() {
        Category category = buildCategory();

        Transaction t = new Transaction();
        t.setTransactionId(transactionId);
        t.setUser(currentUser);
        t.setCategory(category);
        t.setAmount(new BigDecimal("100.00"));
        t.setDescription("Descripción original");
        t.setStatus("COMPLETED");
        t.setDate(LocalDate.now());
        return t;
    }

    private Category buildCategory() {
        Category category = new Category();
        category.setCategoryId(categoryId);
        category.setTitle("Alimentación");
        category.setType("EXPENSE");
        return category;
    }

    private TransactionRequest buildRequest() {
        TransactionRequest req = new TransactionRequest();
        req.setCategoryId(categoryId);
        req.setAmount(new BigDecimal("100.00"));
        req.setDescription("Descripción");
        req.setDate(LocalDate.now());
        req.setStatus("COMPLETED");
        return req;
    }
}
