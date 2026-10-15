package com.psc.adminbackend.controller;

import com.psc.adminbackend.service.AuditService;
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
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class UserController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuditService auditService;

    @Autowired
    private LocalizationService localizationService;

    private final String SECRET = "MySuperSecretKeyThatIsAtLeast32BytesLongForSecurity!";
    private final SecretKey key = Keys.hmacShaKeyFor(SECRET.getBytes());

    // Exclude Super Admin from regular app users list
    @GetMapping("/users")
    public List<Map<String, Object>> getUsers() {
        return jdbcTemplate.queryForList(
                "SELECT id, email, role, kyc_status, language_preference FROM users WHERE LOWER(email) != LOWER(?)",
                "digitech.pramahar@gmail.com"
        );
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

    // Login Route - Restricted to single Super Admin ID
    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String rawPassword = payload.get("password");

        if (!"digitech.pramahar@gmail.com".equalsIgnoreCase(email)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "error", "Access restricted to authorized administrator."));
        }

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
            List<Map<String, Object>> dbUsers = jdbcTemplate.queryForList("SELECT id, email FROM users WHERE LOWER(email) != LOWER('digitech.pramahar@gmail.com')");
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
        List<Map<String, Object>> users = jdbcTemplate.queryForList("SELECT id, email, kyc_status FROM users WHERE LOWER(email) != LOWER('digitech.pramahar@gmail.com')");
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