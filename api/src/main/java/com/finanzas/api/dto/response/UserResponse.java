package com.finanzas.api.dto.response;

import lombok.Data;
import java.util.UUID;

@Data
public class UserResponse {
    private UUID id;
    private String name;
    private String email;
    private String role;
    private String status;
    private String suspendReason;
}
