package com.psc.adminbackend;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
public class AdminBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(AdminBackendApplication.class, args);
    }

    // Automatically provisions/updates the Super Admin credentials safely on boot
    @Bean
    CommandLineRunner initSuperAdmin(JdbcTemplate jdbcTemplate, PasswordEncoder passwordEncoder) {
        return args -> {
            try {
                String email = "digitech.pramahar@gmail.com";
                String rawPassword = "gettheshitdone";
                String hashedPassword = passwordEncoder.encode(rawPassword);

                // Check if the super admin already exists
                String checkSql = "SELECT COUNT(*) FROM users WHERE email = ?";
                Integer count = jdbcTemplate.queryForObject(checkSql, Integer.class, email);

                if (count != null && count > 0) {
                    // Update password and role to guarantee they match and work
                    String updateSql = "UPDATE users SET password_hash = ?, role = 'SUPER_ADMIN', kyc_status = 'VERIFIED' WHERE email = ?";
                    jdbcTemplate.update(updateSql, hashedPassword, email);
                    System.out.println(">>> Super Admin account updated and synced successfully.");
                } else {
                    // Insert fresh super admin record
                    String insertSql = "INSERT INTO users (id, email, password_hash, role, kyc_status, language_preference) VALUES (1, ?, ?, 'SUPER_ADMIN', 'VERIFIED', 'en')";
                    jdbcTemplate.update(insertSql, email, hashedPassword);
                    System.out.println(">>> Super Admin account created successfully.");
                }
            } catch (Exception e) {
                System.out.println(">>> Notice: Cloud SQL initialization skipped or deferred (local offline mode / awaiting auth socket): " + e.getMessage());
            }
        };
    }
}