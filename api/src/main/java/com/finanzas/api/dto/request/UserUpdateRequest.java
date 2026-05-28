package com.finanzas.api.dto.request;

import lombok.Data;

@Data
public class UserUpdateRequest {
    private String name;
    private String email;
}
