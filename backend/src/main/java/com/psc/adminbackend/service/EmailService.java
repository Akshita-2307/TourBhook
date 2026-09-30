package com.psc.adminbackend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public void sendOtpEmail(String toEmail, String otp) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail); // Explicitly set the sender
            message.setTo(toEmail);
            message.setSubject("TourBhook - Password Reset OTP");
            message.setText("Your One-Time Password (OTP) for password recovery is: " + otp + "\nThis code is valid for 15 minutes.");

            mailSender.send(message);
            System.out.println("SUCCESS: Email successfully sent to " + toEmail);
        } catch (Exception e) {
            System.err.println("ERROR: Failed to send email to " + toEmail);
            e.printStackTrace(); // This will print the exact reason if Gmail rejects it
        }
    }
}