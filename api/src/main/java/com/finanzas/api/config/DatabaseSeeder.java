package com.finanzas.api.config;

import com.finanzas.api.model.*;
import com.finanzas.api.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final BudgetRepository budgetRepository;
    private final PocketRepository pocketRepository;

    public DatabaseSeeder(RoleRepository roleRepository, UserRepository userRepository,
                          CategoryRepository categoryRepository, BudgetRepository budgetRepository,
                          PocketRepository pocketRepository) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
        this.budgetRepository = budgetRepository;
        this.pocketRepository = pocketRepository;
    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        if (userRepository.count() > 0) {
            System.out.println("-> La base de datos ya tiene usuarios. Omitiendo carga.");
            return;
        }

        System.out.println("-> Iniciando carga de datos en Supabase...");

        // 1. Guardamos el Rol y recuperamos la instancia manejada
        Role adminRole = new Role();
        adminRole.setRolId(UUID.randomUUID());
        adminRole.setNombre("ADMIN");
        adminRole = roleRepository.save(adminRole); // <-- CLAVE: Reasignamos

        // 2. Guardamos el Usuario usando el rol manejado
        User user = new User();
        user.setNombre("Julio");
        user.setEmail("julio@example.com");
        user.setPasswordHash("hash_seguro_123");
        user.setRole(adminRole);
        user = userRepository.save(user); // <-- CLAVE: Reasignamos

        // 3. Guardamos la Categoría
        Category comida = new Category();
        comida.setTitle("Alimentación");
        comida.setType("EXPENSE");
        comida.setUser(user);
        comida = categoryRepository.save(comida); // <-- CLAVE: Reasignamos

        // 4. Guardamos el Presupuesto
        Budget presupuesto = new Budget();
        presupuesto.setUser(user);
        presupuesto.setTotalAmount(new BigDecimal("2000.00"));
        presupuesto.setMonth(4); // Abril
        presupuesto.setYear(2026);
        presupuesto = budgetRepository.save(presupuesto); // <-- CLAVE: Reasignamos

        // 5. Guardamos el Bolsillo
        Pocket ahorro = new Pocket();
        ahorro.setTitle("Ahorro Viaje");
        ahorro.setAllocatedAmount(new BigDecimal("500.00"));
        ahorro.setCurrentAmount(new BigDecimal("100.00"));
        ahorro.setIsSavings(true);
        ahorro.setUser(user);
        ahorro.setBudget(presupuesto);
        ahorro.setCategory(comida);
        pocketRepository.save(ahorro); // Este es el final, no hace falta reasignar

        System.out.println("-> ¡Carga completada con éxito en Supabase!");
    }
}
