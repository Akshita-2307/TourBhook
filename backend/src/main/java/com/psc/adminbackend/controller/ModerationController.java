package com.psc.adminbackend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/moderation")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class ModerationController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @GetMapping("/reports")
    public ResponseEntity<Map<String, Object>> getReports(
            @RequestParam(required = false, defaultValue = "") String search,
            @RequestParam(required = false, defaultValue = "All") String status,
            @RequestParam(required = false, defaultValue = "All") String severity,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate
    ) {
        Map<String, Object> response = new HashMap<>();
        try {
            StringBuilder sql = new StringBuilder(
                    "SELECT id, report_id AS reportId, content_id AS contentId, content_snippet AS contentText, " +
                            "reported_user AS reportedUserName, reporter AS reporterName, severity, status, " +
                            "created_at AS submittedAt "
            );

            try {
                jdbcTemplate.execute("SELECT moderator_notes FROM content_reports LIMIT 0");
                sql.append(", moderator_notes AS moderatorNotes ");
            } catch (Exception ignored) {}

            try {
                jdbcTemplate.execute("SELECT content_removed FROM content_reports LIMIT 0");
                sql.append(", content_removed AS contentRemoved ");
            } catch (Exception ignored) {}

            sql.append("FROM content_reports WHERE 1=1 ");
            List<Object> params = new ArrayList<>();

            if (status != null && !"All".equalsIgnoreCase(status)) {
                if ("Open".equalsIgnoreCase(status)) {
                    sql.append("AND LOWER(status) IN ('pending', 'review') ");
                } else {
                    sql.append("AND LOWER(status) = LOWER(?) ");
                    params.add(status);
                }
            }

            if (severity != null && !"All".equalsIgnoreCase(severity)) {
                sql.append("AND LOWER(severity) = LOWER(?) ");
                params.add(severity);
            }

            if (search != null && !search.trim().isEmpty()) {
                sql.append("AND (LOWER(report_id) LIKE ? OR LOWER(content_snippet) LIKE ? OR LOWER(reported_user) LIKE ?) ");
                String queryTerm = "%" + search.trim().toLowerCase() + "%";
                params.add(queryTerm);
                params.add(queryTerm);
                params.add(queryTerm);
            }

            if (startDate != null && !startDate.trim().isEmpty()) {
                sql.append("AND DATE(created_at) >= ? ");
                params.add(startDate.trim());
            }
            if (endDate != null && !endDate.trim().isEmpty()) {
                sql.append("AND DATE(created_at) <= ? ");
                params.add(endDate.trim());
            }

            sql.append("ORDER BY created_at DESC LIMIT 50");

            List<Map<String, Object>> rawReports = jdbcTemplate.queryForList(sql.toString(), params.toArray());

            List<Map<String, Object>> reports = new ArrayList<>(rawReports.size());
            for (Map<String, Object> row : rawReports) {
                Map<String, Object> report = new HashMap<>(row);
                String reportedUserName = (String) row.getOrDefault("reportedUserName", "User");
                String reporterName = (String) row.getOrDefault("reporterName", "Reporter");
                String currentStatus = (String) row.getOrDefault("status", "Pending");

                report.put("reportedUser", Map.of(
                        "name", reportedUserName,
                        "username", "@" + (reportedUserName != null ? reportedUserName.toLowerCase().replaceAll("\\s+", "") : "user"),
                        "initials", (reportedUserName != null && reportedUserName.length() >= 2) ? reportedUserName.substring(0, 2).toUpperCase() : "U",
                        "accountStatus", "Blocked".equalsIgnoreCase(currentStatus) ? "Permanently Blocked" : "Active",
                        "previousReports", 0
                ));
                report.put("reporter", Map.of(
                        "name", reporterName,
                        "previousReports", 0
                ));
                report.put("moderationHistory", List.of());
                reports.add(report);
            }

            int openReports = 0;
            int criticalReports = 0;
            int resolvedToday = 0;
            int blockedTodayCount = 0;

            try {
                Map<String, Object> counts = jdbcTemplate.queryForMap(
                        "SELECT " +
                                "COALESCE(SUM(CASE WHEN LOWER(status) IN ('pending', 'review') THEN 1 ELSE 0 END), 0) AS openReports, " +
                                "COALESCE(SUM(CASE WHEN LOWER(severity) IN ('severe', 'high') AND LOWER(status) NOT IN ('resolved', 'approved', 'content removed', 'blocked') THEN 1 ELSE 0 END), 0) AS criticalReports, " +
                                "COALESCE(SUM(CASE WHEN LOWER(status) IN ('resolved', 'approved', 'content removed') AND DATE(created_at) = CURRENT_DATE THEN 1 ELSE 0 END), 0) AS resolvedToday " +
                                "FROM content_reports"
                );
                openReports = ((Number) counts.getOrDefault("openReports", 0)).intValue();
                criticalReports = ((Number) counts.getOrDefault("criticalReports", 0)).intValue();
                resolvedToday = ((Number) counts.getOrDefault("resolvedToday", 0)).intValue();
            } catch (Exception ignored) {}

            try {
                blockedTodayCount = jdbcTemplate.queryForObject(
                        "SELECT COUNT(*) FROM blocked_users WHERE DATE(blocked_at) = CURRENT_DATE", Integer.class);
            } catch (Exception ignored) {
                try {
                    blockedTodayCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM blocked_users", Integer.class);
                } catch (Exception e2) {}
            }

            List<Map<String, Object>> blockedUsers = List.of();
            try {
                blockedUsers = jdbcTemplate.queryForList("SELECT * FROM blocked_users ORDER BY id DESC LIMIT 20");
            } catch (Exception ignored) {}

            response.put("success", true);
            response.put("reports", reports);
            response.put("summary", Map.of(
                    "openReports", openReports,
                    "openReportsChange", 0,
                    "criticalReports", criticalReports,
                    "criticalReportsToday", 0
            ));
            response.put("resolvedToday", resolvedToday);
            response.put("blockedCount", blockedTodayCount);
            response.put("blockedUsers", blockedUsers);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Moderation Reports Fetch Error: " + e.getMessage());
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    @PostMapping("/reports/{reportId}/approve")
    public ResponseEntity<?> approveContent(@PathVariable String reportId) {
        try {
            try {
                jdbcTemplate.execute("ALTER TABLE content_reports MODIFY COLUMN status VARCHAR(50) DEFAULT 'Pending'");
            } catch (Exception ignored) {}

            int updated = jdbcTemplate.update(
                    "UPDATE content_reports SET status = 'Approved', content_removed = FALSE WHERE report_id = ? OR CAST(id AS CHAR) = ?",
                    reportId, reportId
            );
            return ResponseEntity.ok(Map.of("success", true, "updated", updated, "status", "Approved"));
        } catch (Exception e) {
            System.err.println("Approve Content Error: " + e.getMessage());
            return ResponseEntity.status(400).body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/reports/{reportId}/remove-content")
    public ResponseEntity<?> removeContent(@PathVariable String reportId) {
        try {
            try {
                jdbcTemplate.execute("ALTER TABLE content_reports MODIFY COLUMN status VARCHAR(50) DEFAULT 'Pending'");
            } catch (Exception ignored) {}
            try {
                jdbcTemplate.execute("ALTER TABLE content_reports ADD COLUMN content_removed BOOLEAN DEFAULT FALSE");
            } catch (Exception ignored) {}

            int updated = jdbcTemplate.update(
                    "UPDATE content_reports SET status = 'Content Removed', content_removed = TRUE WHERE report_id = ? OR CAST(id AS CHAR) = ?",
                    reportId, reportId
            );
            return ResponseEntity.ok(Map.of("success", true, "updated", updated, "status", "Content Removed"));
        } catch (Exception e) {
            System.err.println("Remove Content Error: " + e.getMessage());
            return ResponseEntity.status(400).body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/reports/{reportId}/status")
    public ResponseEntity<?> updateStatus(@PathVariable String reportId, @RequestBody Map<String, String> payload) {
        String newStatus = payload.get("status");
        try {
            try {
                jdbcTemplate.execute("ALTER TABLE content_reports MODIFY COLUMN status VARCHAR(50) DEFAULT 'Pending'");
            } catch (Exception ignored) {}

            boolean isRemoved = "Content Removed".equalsIgnoreCase(newStatus);
            int updated = jdbcTemplate.update(
                    "UPDATE content_reports SET status = ?, content_removed = ? WHERE report_id = ? OR CAST(id AS CHAR) = ?",
                    newStatus, isRemoved, reportId, reportId
            );
            return ResponseEntity.ok(Map.of("success", true, "updated", updated, "status", newStatus));
        } catch (Exception e) {
            System.err.println("Moderation Status Update Error: " + e.getMessage());
            return ResponseEntity.status(400).body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/reports/{reportId}/notes")
    public ResponseEntity<?> updateNotes(@PathVariable String reportId, @RequestBody Map<String, String> payload) {
        String newNote = payload.get("moderatorNotes");
        try {
            try {
                jdbcTemplate.update(
                        "UPDATE content_reports SET moderator_notes = CASE " +
                                "  WHEN moderator_notes IS NULL OR moderator_notes = '' THEN ? " +
                                "  ELSE CONCAT(moderator_notes, '\n', ?) " +
                                "END WHERE report_id = ? OR CAST(id AS CHAR) = ?",
                        newNote, newNote, reportId, reportId
                );
            } catch (Exception ex) {
                jdbcTemplate.execute("ALTER TABLE content_reports ADD COLUMN moderator_notes TEXT");
                jdbcTemplate.update(
                        "UPDATE content_reports SET moderator_notes = ? WHERE report_id = ? OR CAST(id AS CHAR) = ?",
                        newNote, reportId, reportId
                );
            }
            return ResponseEntity.ok(Map.of("success", true, "message", "Notes saved successfully"));
        } catch (Exception e) {
            System.err.println("Moderator Notes Save Error: " + e.getMessage());
            return ResponseEntity.status(400).body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/reports/{reportId}/block-user")
    public ResponseEntity<?> blockUser(@PathVariable String reportId, @RequestBody Map<String, String> payload) {
        String reason = payload.get("reason");
        try {
            jdbcTemplate.update("UPDATE content_reports SET status = 'Blocked' WHERE report_id = ? OR CAST(id AS CHAR) = ?", reportId, reportId);

            String userName = "User";
            try {
                Map<String, Object> report = jdbcTemplate.queryForMap(
                        "SELECT reported_user FROM content_reports WHERE report_id = ? OR CAST(id AS CHAR) = ?", reportId, reportId);
                userName = (String) report.get("reported_user");
            } catch (Exception ignored) {}

            try {
                jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS blocked_users (id BIGINT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), username VARCHAR(255), reason TEXT, blocked_by VARCHAR(255), blocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, status VARCHAR(50))");
                jdbcTemplate.update(
                        "INSERT INTO blocked_users (name, username, reason, blocked_by, blocked_at, status) " +
                                "VALUES (?, ?, ?, 'Digitech Pramahar', NOW(), 'Permanently Blocked')",
                        userName,
                        "@" + (userName != null ? userName.toLowerCase().replaceAll("\\s+", "") : "user"),
                        reason
                );
            } catch (Exception ignored) {}

            return ResponseEntity.ok(Map.of("success", true, "message", "User blocked successfully"));
        } catch (Exception e) {
            System.err.println("Block User Error: " + e.getMessage());
            return ResponseEntity.status(400).body(Map.of("success", false, "error", e.getMessage()));
        }
    }
}