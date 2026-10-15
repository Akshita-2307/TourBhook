package com.psc.adminbackend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api/kyc")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class KycController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @GetMapping("/queue")
    public ResponseEntity<?> getKycQueue(
            @RequestParam(required = false, defaultValue = "") String search,
            @RequestParam(required = false, defaultValue = "all") String status,
            @RequestParam(required = false, defaultValue = "all") String documentType
    ) {
        Map<String, Object> response = new HashMap<>();
        try {
            StringBuilder sql = new StringBuilder(
                    "SELECT k.id, k.user_id AS userId, " +
                            "COALESCE(u.email, CONCAT('partner', k.id, '@tourbhook.com')) AS email, " +
                            "COALESCE(k.business_name, CONCAT('Partner #', k.id)) AS partnerName, " +
                            "COALESCE(k.document_type, 'Passport') AS documentType, " +
                            "COALESCE(k.document_reference, 'DOC-REF') AS documentReference, " +
                            "COALESCE(k.status, 'PENDING') AS status, " +
                            "k.submitted_at AS submittedDate, " +
                            "k.rejection_reason AS rejectionReason " +
                            "FROM kyc_submissions k " +
                            "LEFT JOIN users u ON k.user_id = u.id " +
                            "WHERE 1=1 "
            );
            List<Object> params = new ArrayList<>();

            if (status != null && !"all".equalsIgnoreCase(status) && !"All Statuses".equalsIgnoreCase(status)) {
                String dbStatus = status.trim().toUpperCase();
                if ("PENDING".equals(dbStatus)) {
                    sql.append("AND UPPER(k.status) IN ('PENDING', 'UNDER_REVIEW') ");
                } else if ("SUBMITTED".equals(dbStatus) || "APPROVED".equals(dbStatus)) {
                    sql.append("AND UPPER(k.status) IN ('APPROVED', 'SUBMITTED') ");
                } else if ("REJECTED".equals(dbStatus)) {
                    sql.append("AND UPPER(k.status) = 'REJECTED' ");
                } else {
                    sql.append("AND UPPER(k.status) = ? ");
                    params.add(dbStatus);
                }
            }

            if (documentType != null && !"all".equalsIgnoreCase(documentType) && !"All Documents".equalsIgnoreCase(documentType)) {
                sql.append("AND LOWER(k.document_type) LIKE LOWER(?) ");
                params.add("%" + documentType.trim() + "%");
            }

            if (search != null && !search.trim().isEmpty()) {
                String term = "%" + search.trim().toLowerCase() + "%";
                sql.append("AND (LOWER(COALESCE(k.business_name, '')) LIKE ? ")
                        .append("OR LOWER(COALESCE(u.email, '')) LIKE ? ")
                        .append("OR CAST(k.id AS CHAR) LIKE ? ")
                        .append("OR LOWER(CONCAT('KYC-', k.id)) LIKE ?) ");
                params.add(term);
                params.add(term);
                params.add(term);
                params.add(term);
            }

            sql.append("ORDER BY k.submitted_at DESC LIMIT 50");

            List<Map<String, Object>> rows;
            try {
                rows = jdbcTemplate.queryForList(sql.toString(), params.toArray());
            } catch (Exception ex) {
                rows = List.of();
            }

            DateTimeFormatter displayFormat = DateTimeFormatter.ofPattern("d MMM yyyy");
            List<Map<String, Object>> submissions = new ArrayList<>(rows.size());

            for (Map<String, Object> row : rows) {
                Map<String, Object> item = new HashMap<>(row);
                String pName = (String) row.getOrDefault("partnerName", "Partner");
                String rawStatus = String.valueOf(row.getOrDefault("status", "PENDING")).trim().toUpperCase();

                String displayStatus = "Pending";
                if ("APPROVED".equals(rawStatus) || "SUBMITTED".equals(rawStatus)) {
                    displayStatus = "Submitted";
                } else if ("REJECTED".equals(rawStatus)) {
                    displayStatus = "Rejected";
                } else if ("PENDING".equals(rawStatus) || "UNDER_REVIEW".equals(rawStatus)) {
                    displayStatus = "Pending";
                }

                item.put("status", displayStatus);

                String initials = "P";
                if (pName != null && !pName.trim().isEmpty()) {
                    String[] parts = pName.trim().split("\\s+");
                    if (parts.length >= 2) {
                        initials = ("" + parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
                    } else {
                        initials = pName.substring(0, Math.min(2, pName.length())).toUpperCase();
                    }
                }
                item.put("initials", initials);
                item.put("color", "#1775f4");

                Object submittedRaw = row.get("submittedDate");
                if (submittedRaw instanceof java.sql.Date) {
                    item.put("submittedDate", ((java.sql.Date) submittedRaw).toLocalDate().format(displayFormat));
                } else if (submittedRaw instanceof java.sql.Timestamp) {
                    item.put("submittedDate", ((java.sql.Timestamp) submittedRaw).toLocalDateTime().toLocalDate().format(displayFormat));
                } else if (submittedRaw != null) {
                    item.put("submittedDate", submittedRaw.toString());
                } else {
                    item.put("submittedDate", LocalDate.now().format(displayFormat));
                }

                String docType = (String) row.getOrDefault("documentType", "Passport");
                Map<String, Object> docs = new HashMap<>();
                docs.put("panCard", Map.of(
                        "submitted", true,
                        "label", "PAN Card",
                        "fileName", "pan-card.pdf",
                        "fileUrl", "/mock-documents/pan-card.pdf",
                        "previewUrl", "/mock-documents/pan-card-preview.png"
                ));
                docs.put("businessProof", Map.of(
                        "submitted", true,
                        "label", docType,
                        "fileName", docType.toLowerCase().replaceAll("\\s+", "-") + ".pdf",
                        "fileUrl", "/mock-documents/license.pdf",
                        "previewUrl", "/mock-documents/license-preview.png"
                ));
                item.put("documents", docs);

                submissions.add(item);
            }

            int pendingCount = 0;
            int submittedCount = 0;
            int rejectedCount = 0;

            try {
                Map<String, Object> counts = jdbcTemplate.queryForMap(
                        "SELECT " +
                                "COALESCE(SUM(CASE WHEN UPPER(status) IN ('PENDING', 'UNDER_REVIEW') THEN 1 ELSE 0 END), 0) AS pendingReview, " +
                                "COALESCE(SUM(CASE WHEN UPPER(status) IN ('APPROVED', 'SUBMITTED') THEN 1 ELSE 0 END), 0) AS submittedThisWeek, " +
                                "COALESCE(SUM(CASE WHEN UPPER(status) = 'REJECTED' THEN 1 ELSE 0 END), 0) AS rejected " +
                                "FROM kyc_submissions"
                );
                pendingCount = ((Number) counts.getOrDefault("pendingReview", 0)).intValue();
                submittedCount = ((Number) counts.getOrDefault("submittedThisWeek", 0)).intValue();
                rejectedCount = ((Number) counts.getOrDefault("rejected", 0)).intValue();
            } catch (Exception ignored) {}

            response.put("success", true);
            response.put("submissions", submissions);
            response.put("summary", Map.of(
                    "pendingReview", pendingCount,
                    "submittedThisWeek", submittedCount,
                    "rejected", rejectedCount
            ));

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("KYC Queue Fetch Error: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/review/{id}")
    public ResponseEntity<?> reviewKyc(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        String status = payload.get("status");
        String rejectionReason = payload.getOrDefault("rejectionReason", "");

        try {
            String dbStatus = "PENDING";
            if ("Submitted".equalsIgnoreCase(status) || "APPROVED".equalsIgnoreCase(status)) {
                dbStatus = "APPROVED";
            } else if ("Rejected".equalsIgnoreCase(status)) {
                dbStatus = "REJECTED";
            } else if ("Pending".equalsIgnoreCase(status)) {
                dbStatus = "PENDING";
            }

            int updated = jdbcTemplate.update(
                    "UPDATE kyc_submissions SET status = ?, rejection_reason = ? WHERE id = ?",
                    dbStatus, rejectionReason, id
            );

            try {
                Map<String, Object> kycRow = jdbcTemplate.queryForMap("SELECT user_id FROM kyc_submissions WHERE id = ?", id);
                if (kycRow.get("user_id") != null) {
                    Long userId = ((Number) kycRow.get("user_id")).longValue();
                    jdbcTemplate.update("UPDATE users SET kyc_status = ? WHERE id = ?", dbStatus, userId);
                }
            } catch (Exception ignored) {}

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "updated", updated,
                    "status", dbStatus,
                    "message", "KYC status updated to " + dbStatus
            ));
        } catch (Exception e) {
            System.err.println("KYC Review Error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("success", false, "error", e.getMessage()));
        }
    }
}