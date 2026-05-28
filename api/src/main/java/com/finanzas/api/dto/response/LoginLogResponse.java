package com.finanzas.api.dto.response;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class LoginLogResponse {
    private UUID loginLogId;
    private UUID userId;
    private String userName;
    private String userEmail;
    private LocalDateTime timestamp;
}
