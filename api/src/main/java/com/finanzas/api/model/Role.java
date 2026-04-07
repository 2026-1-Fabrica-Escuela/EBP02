package com.finanzas.api.model;

import jakarta.persistence.*;
import lombok.Data;
import java.util.UUID;

@Entity
@Table(name = "roles")
@Data
public class Role {

    @Id
    @Column(name = "rol_id")
    private UUID rolId;

    @Column(name = "nombre", nullable = false, length = 20)
    private String nombre;
}
