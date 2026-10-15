package com.psc.adminbackend;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
public class AdminBackendApplication {

    @Value("${SUPER_ADMIN_EMAIL}")
    private String adminEmail;

    @Value("${SUPER_ADMIN_PASSWORD}")
    private String adminPassword;

    public static void main(String[] args) {
        SpringApplication.run(AdminBackendApplication.class, args);
    }

    // Automatically provisions the initial Super Admin using credentials safely injected via properties.
    // Afterwards, passwords changed via the admin panel modal are managed purely in Cloud SQL.
    @Bean
    CommandLineRunner initSuperAdmin(JdbcTemplate jdbcTemplate, PasswordEncoder passwordEncoder) {
        return args -> {
            try {
                // Ensure admins table exists
                jdbcTemplate.execute(
                        "CREATE TABLE IF NOT EXISTS admins (" +
                                "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                                "email VARCHAR(255) NOT NULL UNIQUE, " +
                                "password_hash VARCHAR(255) NOT NULL, " +
                                "role VARCHAR(50) DEFAULT 'SUPER_ADMIN', " +
                                "phone_number VARCHAR(50), " +
                                "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)"
                );

                // Check if admin already exists
                Integer count = jdbcTemplate.queryForObject(
                        "SELECT COUNT(*) FROM admins WHERE LOWER(email) = LOWER(?)",
                        Integer.class,
                        adminEmail
                );

                // If table is empty, seed it once with the initial password injected from properties
                if (count == null || count == 0) {
                    String initialHash = passwordEncoder.encode(adminPassword);

                    jdbcTemplate.update(
                            "INSERT INTO admins (email, password_hash, role) VALUES (?, ?, 'SUPER_ADMIN')",
                            adminEmail, initialHash
                    );
                    System.out.println(">>> Super Admin account initialized securely via properties configuration.");
                } else {
                    System.out.println(">>> Super Admin account already exists. Managing credentials via Cloud SQL.");
                }
            } catch (Exception e) {
                System.out.println(">>> Notice: Cloud SQL initialization skipped or deferred: " + e.getMessage());
            }
        };
    }
}