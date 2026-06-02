package com.finanzas.api.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ForgotPasswordRequest {
    @NotBlank(message = "El correo electrónico es obligatorio")
    @Email(message = "Ingresa un correo electrónico válido")
    private String email;
}
