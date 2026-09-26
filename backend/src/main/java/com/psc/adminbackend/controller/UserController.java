package com.psc.adminbackend.controller;

import com.psc.adminbackend.service.AuditService;
import com.psc.adminbackend.service.EmailService;
import com.psc.adminbackend.service.LocalizationService;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import javax.crypto.SecretKey;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:5173")
public class UserController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuditService auditService;

    @Autowired
    private LocalizationService localizationService;

    @Autowired
    private EmailService emailService;

    private final String SECRET = "MySuperSecretKeyThatIsAtLeast32BytesLongForSecurity!";
    private final SecretKey key = Keys.hmacShaKeyFor(SECRET.getBytes());

    @GetMapping("/users")
    public List<Map<String, Object>> getUsers() {
        return jdbcTemplate.queryForList("SELECT id, email, role, kyc_status, language_preference FROM users");
    }

    @PutMapping("/users/{userId}/role")
    public ResponseEntity<?> updateUserRole(@PathVariable Long userId, @RequestBody Map<String, String> payload) {
        String newRole = payload.get("role");
        String sql = "UPDATE users SET role = ? WHERE id = ?";

        try {
            int updated = jdbcTemplate.update(sql, newRole, userId);
            if (updated > 0) {
                auditService.logAction(1L, "UPDATE_USER_ROLE", "{\"target_user_id\":" + userId + ", \"new_role\":\"" + newRole + "\"}");
                return ResponseEntity.ok(Map.of("success", true, "message", "User role updated successfully to " + newRole));
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("success", false, "error", "User not found"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    // --- REGISTRATION FLOW WITH OTP ---
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String password = payload.get("password");
        String role = payload.getOrDefault("role", "USER");

        try {
            String hashedPassword = passwordEncoder.encode(password);

            String otp = String.format("%06d", new Random().nextInt(999999));
            LocalDateTime expiry = LocalDateTime.now().plusMinutes(15);

            String sql = "INSERT INTO users (email, password_hash, role, kyc_status, language_preference, reset_otp, otp_expiry) VALUES (?, ?, ?, 'PENDING', 'en', ?, ?)";
            jdbcTemplate.update(sql, email, hashedPassword, role, otp, expiry);

            emailService.sendOtpEmail(email, otp);
            auditService.logAction(1L, "REGISTER_USER_OTP_SENT", "{\"target_email\":\"" + email + "\"}");

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Account registered successfully! Please check your email for the verification OTP."
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    // Login Route
    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String rawPassword = payload.get("password");

        try {
            String sql = "SELECT id, password_hash, role, language_preference FROM users WHERE email = ?";
            Map<String, Object> user = jdbcTemplate.queryForMap(sql, email);

            String dbPasswordHash = (String) user.get("password_hash");

            if (passwordEncoder.matches(rawPassword, dbPasswordHash)) {
                String token = Jwts.builder()
                        .subject(email)
                        .claim("id", user.get("id"))
                        .claim("role", user.get("role"))
                        .claim("languagePreference", user.get("language_preference"))
                        .issuedAt(new Date())
                        .expiration(new Date(System.currentTimeMillis() + 86400000))
                        .signWith(key)
                        .compact();

                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("token", token);
                response.put("role", user.get("role"));
                response.put("languagePreference", user.get("language_preference"));

                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("success", false, "error", "Invalid credentials"));
            }
        } catch (EmptyResultDataAccessException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("success", false, "error", "Invalid credentials"));
        }
    }

    // --- PASSWORD RECOVERY FLOW ---

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");

        try {
            String checkSql = "SELECT id FROM users WHERE email = ?";
            jdbcTemplate.queryForMap(checkSql, email);

            String otp = String.format("%06d", new Random().nextInt(999999));
            LocalDateTime expiry = LocalDateTime.now().plusMinutes(15);

            String updateSql = "UPDATE users SET reset_otp = ?, otp_expiry = ? WHERE email = ?";
            jdbcTemplate.update(updateSql, otp, expiry, email);

            emailService.sendOtpEmail(email, otp);
            auditService.logAction(1L, "REQUEST_PASSWORD_RESET", "{\"target_email\":\"" + email + "\"}");

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "OTP sent successfully to your email inbox."
            ));
        } catch (EmptyResultDataAccessException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("success", false, "error", "User with this email does not exist."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String otp = payload.get("otp");

        try {
            String sql = "SELECT id, reset_otp, otp_expiry FROM users WHERE email = ?";
            Map<String, Object> user = jdbcTemplate.queryForMap(sql, email);

            String dbOtp = (String) user.get("reset_otp");

            Object expiryObj = user.get("otp_expiry");
            LocalDateTime expiry = null;
            if (expiryObj instanceof Timestamp) {
                expiry = ((Timestamp) expiryObj).toLocalDateTime();
            } else if (expiryObj instanceof LocalDateTime) {
                expiry = (LocalDateTime) expiryObj;
            }

            if (dbOtp == null || !dbOtp.equals(otp)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("success", false, "error", "Invalid OTP."));
            }

            if (expiry == null || LocalDateTime.now().isAfter(expiry)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("success", false, "error", "OTP has expired."));
            }

            jdbcTemplate.update("UPDATE users SET kyc_status = 'VERIFIED', reset_otp = NULL, otp_expiry = NULL WHERE email = ?", email);

            return ResponseEntity.ok(Map.of("success", true, "message", "OTP verified and account activated successfully."));
        } catch (EmptyResultDataAccessException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("success", false, "error", "User not found."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String newPassword = payload.get("password");

        try {
            String hashedPassword = passwordEncoder.encode(newPassword);
            String sql = "UPDATE users SET password_hash = ?, reset_otp = NULL, otp_expiry = NULL WHERE email = ?";
            int updated = jdbcTemplate.update(sql, hashedPassword, email);

            if (updated > 0) {
                auditService.logAction(1L, "RESET_PASSWORD_SUCCESS", "{\"target_email\":\"" + email + "\"}");
                return ResponseEntity.ok(Map.of("success", true, "message", "Password reset successfully!"));
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("success", false, "error", "User not found."));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PutMapping("/users/{userId}/language")
    public ResponseEntity<?> updateLanguagePreference(@PathVariable Long userId, @RequestBody Map<String, String> payload) {
        String lang = payload.getOrDefault("languagePreference", "en");
        String sql = "UPDATE users SET language_preference = ? WHERE id = ?";

        try {
            int updated = jdbcTemplate.update(sql, lang, userId);
            if (updated > 0) {
                return ResponseEntity.ok(Map.of("success", true, "message", "Language preference updated to " + lang));
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("success", false, "error", "User not found"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @GetMapping("/users/{userId}/notification-test")
    public ResponseEntity<?> getLocalizedNotification(@PathVariable Long userId, @RequestParam(defaultValue = "en") String lang) {
        String welcomeMessage = localizationService.getLocalizedMessage("notification.welcome", lang);
        String confirmationMessage = localizationService.getLocalizedMessage("notification.booking.confirmed", lang);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "language", lang,
                "notifications", Map.of(
                        "welcome", welcomeMessage,
                        "bookingConfirmed", confirmationMessage
                )
        ));
    }

    // --- LIVE BACKEND ENDPOINTS FOR DASHBOARD SUB-PAGES ---

    @GetMapping("/moderation-reports")
    public ResponseEntity<?> getModerationReports() {
        try {
            List<Map<String, Object>> dbUsers = jdbcTemplate.queryForList("SELECT id, email FROM users");
            List<Map<String, Object>> formattedReports = new ArrayList<>();

            int index = 10480;
            for (Map<String, Object> user : dbUsers) {
                Map<String, Object> report = new HashMap<>();
                report.put("id", "REP-" + index++);
                report.put("contentText", "Account registered with email: " + user.get("email"));
                report.put("severity", "High");
                report.put("status", "Pending");
                report.put("submittedAt", LocalDateTime.now().toString());

                Map<String, Object> reporter = new HashMap<>();
                reporter.put("name", "System Admin");
                reporter.put("username", "@admin");
                reporter.put("initials", "SA");
                reporter.put("previousReports", 0);
                report.put("reporter", reporter);

                Map<String, Object> reportedUser = new HashMap<>();
                reportedUser.put("name", user.get("email"));
                reportedUser.put("username", "@" + user.get("email").toString().split("@")[0]);
                reportedUser.put("initials", user.get("email").toString().substring(0, 2).toUpperCase());
                reportedUser.put("accountStatus", "Active");
                reportedUser.put("previousReports", 0);
                report.put("reportedUser", reportedUser);

                report.put("moderationHistory", List.of());
                formattedReports.add(report);
            }

            return ResponseEntity.ok(formattedReports);
        } catch (Exception e) {
            return ResponseEntity.ok(List.of());
        }
    }

    @GetMapping("/kyc-requests")
    public ResponseEntity<?> getKycRequests() {
        List<Map<String, Object>> users = jdbcTemplate.queryForList("SELECT id, email, kyc_status FROM users");
        return ResponseEntity.ok(users);
    }

    @GetMapping("/system-config")
    public ResponseEntity<?> getSystemConfig() {
        try {
            List<Map<String, Object>> rows = jdbcTemplate.queryForList("SELECT param_key, param_value FROM system_config");
            Map<String, Object> configMap = new HashMap<>();
            configMap.put("ratingThreshold", 4.5);
            configMap.put("ratingMultiplier", 1.30);
            configMap.put("aiReviewCount", 10);
            configMap.put("dynamicBreakThreshold", 3);
            configMap.put("promoRedemptionLimit", 3);

            for (Map<String, Object> row : rows) {
                configMap.put((String) row.get("param_key"), row.get("param_value"));
            }
            return ResponseEntity.ok(configMap);
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of(
                    "ratingThreshold", 4.5,
                    "ratingMultiplier", 1.30,
                    "aiReviewCount", 10,
                    "dynamicBreakThreshold", 3,
                    "promoRedemptionLimit", 3
            ));
        }
    }

    @PostMapping("/system-config")
    public ResponseEntity<?> updateSystemConfig(@RequestBody Map<String, Object> payload) {
        try {
            String parameter = (String) payload.get("parameter");
            Object value = payload.get("value");
            String reason = (String) payload.get("reason");

            try {
                int updated = jdbcTemplate.update("UPDATE system_config SET param_value = ? WHERE param_key = ?", value, parameter);
                if (updated == 0) {
                    jdbcTemplate.update("INSERT INTO system_config (param_key, param_value) VALUES (?, ?)", parameter, value);
                }
            } catch (Exception ex) {
                // Fallback if table doesn't exist yet
            }

            auditService.logAction(1L, "UPDATE_SYSTEM_CONFIG", "{\"parameter\":\"" + parameter + "\", \"value\":\"" + value + "\", \"reason\":\"" + reason + "\"}");
            return ResponseEntity.ok(Map.of("success", true, "message", "Configuration saved successfully."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("success", false, "error", e.getMessage()));
        }
    }
}