package com.psc.adminbackend.controller;

import com.psc.adminbackend.entity.User;
import com.psc.adminbackend.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        authService.processForgotPassword(email);
        return ResponseEntity.ok(Map.of("message", "Password reset OTP sent to your email."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String otp = request.get("otp");
        String newPassword = request.get("newPassword");

        authService.resetPassword(email, otp, newPassword);
        return ResponseEntity.ok(Map.of("message", "Password successfully reset. You can now sign in."));
    }

    @PostMapping("/google-signin")
    public ResponseEntity<?> googleSignIn(@RequestBody Map<String, String> request) {
        String idToken = request.get("token");
        if (idToken == null || idToken.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Google token is missing."));
        }

        User user = authService.authenticateGoogleUser(idToken);

        return ResponseEntity.ok(Map.of(
                "message", "Google Sign-In successful",
                "email", user.getEmail()
        ));
    }
}