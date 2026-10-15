package com.psc.adminbackend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class DashboardController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @GetMapping("/stats")
    public Map<String, Object> getDashboardStats() {
        Map<String, Object> response = new HashMap<>();

        try {
            // Live queries hitting MySQL database tables (excluding super admin)
            Integer totalUsers = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM users WHERE LOWER(email) != LOWER('digitech.pramahar@gmail.com')", Integer.class);
            if (totalUsers == null) {
                totalUsers = 0;
            }

            Integer pendingKycCount = 0;
            try {
                pendingKycCount = jdbcTemplate.queryForObject(
                        "SELECT COUNT(*) FROM kyc_submissions WHERE status = 'PENDING'", Integer.class
                );
                if (pendingKycCount == null) pendingKycCount = 0;
            } catch (Exception ignored) {}

            // Fetch live preferred users/cities from database
            List<Map<String, Object>> dbUsers = List.of();
            try {
                dbUsers = jdbcTemplate.queryForList(
                        "SELECT id, email FROM users WHERE LOWER(email) != LOWER('digitech.pramahar@gmail.com') ORDER BY id DESC LIMIT 5"
                );
            } catch (Exception ignored) {}

            List<Map<String, Object>> preferredCitiesList = new ArrayList<>();
            double totalDivisor = Math.max(1, dbUsers.size());
            for (int i = 0; i < dbUsers.size(); i++) {
                Map<String, Object> u = dbUsers.get(i);
                String email = (String) u.get("email");
                String namePart = email != null ? email.split("@")[0] : "User " + i;
                preferredCitiesList.add(Map.of(
                        "id", u.get("id"),
                        "name", namePart,
                        "symbol", namePart.substring(0, 1).toUpperCase(),
                        "accent", i % 2 == 0 ? "indigo" : "cyan",
                        "users", 1,
                        "sharePercent", Math.round(100.0 / totalDivisor * 10.0) / 10.0
                ));
            }

            if (preferredCitiesList.isEmpty()) {
                preferredCitiesList.add(Map.of(
                        "id", 1, "name", "No users yet", "symbol", "N", "accent", "indigo", "users", 0, "sharePercent", 0.0
                ));
            }

            LocalDate today = LocalDate.now();
            DateTimeFormatter isoFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd");

            Map<String, Object> chartPeriods = new HashMap<>();
            chartPeriods.put("week", Map.of("label", "This Week", "points", generateChartPoints("week", totalUsers)));
            chartPeriods.put("month", Map.of("label", "Last 30 Days", "points", generateChartPoints("month", totalUsers)));
            chartPeriods.put("quarter", Map.of("label", "Last 90 Days", "points", generateChartPoints("quarter", totalUsers)));
            chartPeriods.put("year", Map.of("label", "This Year", "points", generateChartPoints("year", totalUsers)));

            response.put("success", true);
            response.put("user", Map.of(
                    "firstName", "Digitech",
                    "fullName", "Digitech Pramahar",
                    "role", "SUPER_ADMIN",
                    "initials", "DP"
            ));
            response.put("metrics", List.of(
                    Map.of("id", "active-users", "label", "Active Users", "value", totalUsers, "tone", "blue", "icon", "group", "changePercent", 8.2, "sparkline", List.of(0, 0, 0, 0, 1, 1, totalUsers)),
                    Map.of("id", "new-users", "label", "New Users", "value", totalUsers, "tone", "green", "icon", "userPlus", "changePercent", 12.5, "sparkline", List.of(0, 0, 0, 1, 1, 1, totalUsers)),
                    Map.of("id", "total-users", "label", "Total Users", "value", totalUsers, "tone", "purple", "icon", "users", "changePercent", 5.6, "sparkline", List.of(0, 0, 1, 1, 1, 1, totalUsers)),
                    Map.of("id", "pending-kyc", "label", "Pending KYC", "value", pendingKycCount, "tone", "amber", "icon", "approval", "changePercent", 2.1, "sparkline", List.of(0, 0, 0, 0, 0, 0, pendingKycCount))
            ));
            response.put("reportingPeriod", Map.of(
                    "startDate", today.minusDays(7).format(isoFormat),
                    "endDate", today.format(isoFormat),
                    "comparisonLabel", "vs last week"
            ));
            response.put("newUsersChart", Map.of(
                    "title", "New Users by Time",
                    "periods", chartPeriods
            ));
            response.put("preferredCities", preferredCitiesList);

        } catch (Exception e) {
            response.put("success", false);
            response.put("error", e.getMessage());
        }

        return response;
    }

    @GetMapping("/user-activity-chart")
    public ResponseEntity<Map<String, Object>> getUserActivityChart(@RequestParam(defaultValue = "week") String period) {
        Map<String, Object> response = new HashMap<>();
        try {
            Integer totalUsers = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM users WHERE LOWER(email) != LOWER('digitech.pramahar@gmail.com')", Integer.class);
            if (totalUsers == null) totalUsers = 0;

            List<Map<String, Object>> points = generateChartPoints(period, totalUsers);
            response.put("success", true);
            response.put("period", period);
            response.put("points", points);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Dashboard Chart Fetch Error: " + e.getMessage());
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "period", period,
                    "points", generateChartPoints(period, 1)
            ));
        }
    }

    private List<Map<String, Object>> generateChartPoints(String period, int totalUsers) {
        DateTimeFormatter displayFormat = DateTimeFormatter.ofPattern("MMM d");
        List<Map<String, Object>> points = new ArrayList<>();

        int intervals = 7;
        int stepDays = 1;

        if ("month".equalsIgnoreCase(period)) {
            intervals = 6;
            stepDays = 5;
        } else if ("quarter".equalsIgnoreCase(period) || "90days".equalsIgnoreCase(period)) {
            intervals = 7;
            stepDays = 14;
        } else if ("year".equalsIgnoreCase(period)) {
            intervals = 12;
            stepDays = 30;
        }

        LocalDate today = LocalDate.now();

        for (int i = intervals - 1; i >= 0; i--) {
            LocalDate pointDate = today.minusDays((long) i * stepDays);
            String label = pointDate.format(displayFormat);

            int userCountAtPoint = (i == 0) ? totalUsers : 0;

            try {
                Integer count = jdbcTemplate.queryForObject(
                        "SELECT COUNT(*) FROM users WHERE LOWER(email) != LOWER('digitech.pramahar@gmail.com') AND DATE(created_at) <= ?",
                        Integer.class,
                        pointDate.toString()
                );
                if (count != null) {
                    userCountAtPoint = count;
                }
            } catch (Exception ignored) {}

            points.add(Map.of(
                    "label", label,
                    "value", userCountAtPoint
            ));
        }

        return points;
    }
}