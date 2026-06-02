package com.finanzas.api;

import com.finanzas.api.service.EmailService;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

@SpringBootTest
class ApiApplicationTests {

    @MockitoBean
    JavaMailSender javaMailSender;

    @MockitoBean
    EmailService emailService;

    @Test
    void contextLoads() {
    }
}
