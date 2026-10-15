package com.psc.adminbackend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class AdminController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @GetMapping("/profile")
    public ResponseEntity<?> getAdminProfile(@RequestParam(defaultValue = "digitech.pramahar@gmail.com") String email) {
        try {
            Map<String, Object> admin = jdbcTemplate.queryForMap(
                    "SELECT id, email, role, phone_number FROM admins WHERE LOWER(email) = LOWER(?)",
                    email
            );
            return ResponseEntity.ok(Map.of("success", true, "admin", admin));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("success", true, "admin", Map.of("email", email, "role", "SUPER_ADMIN", "phone_number", "")));
        }
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateAdminProfile(@RequestBody Map<String, String> payload) {
        String email = payload.getOrDefault("email", "digitech.pramahar@gmail.com");
        String phone = payload.get("phone");
        String newPassword = payload.get("newPassword");

        try {
            // Ensure phone_number column exists
            try {
                jdbcTemplate.execute("ALTER TABLE admins ADD COLUMN phone_number VARCHAR(50)");
            } catch (Exception ignored) {}

            if (newPassword != null && !newPassword.trim().isEmpty()) {
                String hashed = passwordEncoder.encode(newPassword.trim());
                jdbcTemplate.update(
                        "UPDATE admins SET phone_number = ?, password_hash = ? WHERE LOWER(email) = LOWER(?)",
                        phone, hashed, email
                );
            } else {
                jdbcTemplate.update(
                        "UPDATE admins SET phone_number = ? WHERE LOWER(email) = LOWER(?)",
                        phone, email
                );
            }

            return ResponseEntity.ok(Map.of("success", true, "message", "Admin profile updated successfully."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("success", false, "error", e.getMessage()));
        }
    }
}