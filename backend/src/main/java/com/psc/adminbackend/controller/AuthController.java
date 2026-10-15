package com.psc.adminbackend.controller;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class AuthController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private final String SECRET = "MySuperSecretKeyThatIsAtLeast32BytesLongForSecurity!";
    private final SecretKey key = Keys.hmacShaKeyFor(SECRET.getBytes());

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String email = credentials.get("email");
        String password = credentials.get("password");

        try {
            // Strictly enforce Super Admin email
            if (!"digitech.pramahar@gmail.com".equalsIgnoreCase(email)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("success", false, "error", "Access restricted to authorized administrator."));
            }

            // Directly query and verify password hash from Cloud SQL database
            boolean passwordMatches = false;
            try {
                String dbHash = jdbcTemplate.queryForObject(
                        "SELECT password_hash FROM admins WHERE LOWER(email) = LOWER(?)",
                        String.class,
                        email
                );
                if (dbHash != null && passwordEncoder.matches(password, dbHash)) {
                    passwordMatches = true;
                }
            } catch (Exception e) {
                System.err.println("Database Authentication Error: " + e.getMessage());
            }

            if (passwordMatches) {
                long hundredYearsInMillis = 3153600000000L;
                String token = Jwts.builder()
                        .subject(email)
                        .claim("role", "SUPER_ADMIN")
                        .issuedAt(new Date())
                        .expiration(new Date(System.currentTimeMillis() + hundredYearsInMillis))
                        .signWith(key)
                        .compact();

                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "token", token,
                        "role", "SUPER_ADMIN",
                        "message", "Login successful"
                ));
            }

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "error", "Invalid email or password."));

        } catch (Exception e) {
            System.err.println("Login Error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "error", e.getMessage()));
        }
    }
}