package com.psc.adminbackend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendOtpEmail(String toEmail, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("digitech.pramahar@gmail.com");
        message.setTo(toEmail);
        message.setSubject("TourBhook Admin - Password Reset Verification Code");
        message.setText("Your 6-digit verification code for TourBhook Admin is: " + otp + "\n\nThis code will expire in 15 minutes.");
        mailSender.send(message);
    }
}