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
        message.setTo(toEmail);
        message.setSubject("TourBhook - Password Reset OTP");
        message.setText("Your One-Time Password (OTP) for password recovery is: " + otp + "\nThis code is valid for 15 minutes.");

        mailSender.send(message);
    }
}