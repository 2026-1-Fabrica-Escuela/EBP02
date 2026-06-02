package com.finanzas.api.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromAddress;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    public void sendPasswordResetEmail(String toEmail, String resetToken) {
        String resetLink = frontendUrl + "/reset-password?token=" + resetToken;

        String html = """
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #4F46E5;">Restablecer contraseña — Fluent Finanzas</h2>
              <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
              <p>Haz clic en el botón para crear una nueva contraseña. El enlace es válido por <strong>30 minutos</strong>.</p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="%s"
                   style="background-color: #4F46E5; color: white; padding: 14px 28px;
                          text-decoration: none; border-radius: 8px; font-size: 16px;">
                  Restablecer contraseña
                </a>
              </div>
              <p style="color: #6B7280; font-size: 13px;">
                Si no solicitaste este cambio, ignora este correo. Tu contraseña no será modificada.
              </p>
              <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;">
              <p style="color: #9CA3AF; font-size: 12px;">Fluent · Finanzas Personales</p>
            </div>
            """.formatted(resetLink);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(toEmail);
            helper.setSubject("Restablecer tu contraseña — Fluent Finanzas");
            helper.setText(html, true);
            mailSender.send(message);
        } catch (MessagingException | MailException e) {
            log.error("Error enviando correo a {}: {}", toEmail, e.getMessage(), e);
            throw new RuntimeException("No se pudo enviar el correo de restablecimiento. Intenta más tarde.");
        }
    }
}
