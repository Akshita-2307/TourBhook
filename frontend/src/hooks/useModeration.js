import { useEffect, useRef, useState, useMemo } from "react";
import {
  defaultModerationFilters,
  moderationReferenceTime,
} from "../data/moderationMockData";

function dateBoundary(value, endOfDay = false) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(
      year,
      month - 1,
      day,
      endOfDay ? 23 : 0,
      endOfDay ? 59 : 0,
      endOfDay ? 59 : 0,
      endOfDay ? 999 : 0,
  ).getTime();
}

export function useModeration() {
  const [reports, setReports] = useState([]);
  const [summary, setSummary] = useState({ openReports: 0, criticalReports: 0, resolvedToday: 0 });
  const [resolvedToday, setResolvedToday] = useState(0);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [filters, setFilters] = useState({ ...defaultModerationFilters });
  const [summaryFilter, setSummaryFilter] = useState(null);
  const [sortOrder, setSortOrder] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [toast, setToast] = useState("");
  const toastTimer = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    fetch("http://localhost:8080/api/moderation/reports", {
      headers: {
        "Authorization": token ? `Bearer ${token}` : "",
        "Content-Type": "application/json"
      }
    })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch moderation reports");
          return res.json();
        })
        .then((data) => {
          if (data && data.success) {
            if (Array.isArray(data.reports)) setReports(data.reports);
            if (data.summary) setSummary(data.summary);
            if (data.resolvedToday !== undefined) setResolvedToday(data.resolvedToday);
            if (Array.isArray(data.blockedUsers)) setBlockedUsers(data.blockedUsers);
          }
        })
        .catch((err) => {
          console.warn("Backend offline for moderation, using empty fallback:", err);
        });
  }, []);

  useEffect(
      () => () => {
        if (toastTimer.current) window.clearTimeout(toastTimer.current);
      },
      [],
  );

  const notify = (message) => {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 3200);
  };

  const updateFilters = (changes) => {
    setFilters((current) => ({ ...current, ...changes }));
    setSummaryFilter(null);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({ ...defaultModerationFilters });
    setSummaryFilter(null);
    setCurrentPage(1);
  };

  const applySummaryFilter = (filter) => {
    setSummaryFilter(filter);
    setFilters({
      ...defaultModerationFilters,
      severity: filter === "critical" ? "Severe" : "All",
      status: filter === "resolved" ? "Resolved" : "All",
    });
    setCurrentPage(1);
  };

  const filteredReports = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    const start = dateBoundary(filters.startDate);
    const end = dateBoundary(filters.endDate, true);

    return reports
        .filter((report) => {
          const searchable = [
            report.reportId || report.id,
            report.contentText || report.contentSnippet,
            report.reportedUser?.name,
            report.reportedUser?.username,
          ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();
          const submitted = new Date(report.submittedAt || report.createdAt || Date.now()).getTime();

          return (
              (!query || searchable.includes(query)) &&
              (filters.status === "All" || report.status === filters.status) &&
              (filters.severity === "All" || report.severity === filters.severity) &&
              (summaryFilter !== "open" ||
                  report.status === "Pending" ||
                  report.status === "Review") &&
              (!start || submitted >= start) &&
              (!end || submitted <= end)
          );
        })
        .sort((first, second) => {
          const firstDate = new Date(first.submittedAt || first.createdAt || 0).getTime();
          const secondDate = new Date(second.submittedAt || second.createdAt || 0).getTime();
          return sortOrder === "newest" ? secondDate - firstDate : firstDate - secondDate;
        });
  }, [filters, reports, sortOrder, summaryFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredReports.length / rowsPerPage));
  const safePage = Math.min(currentPage, pageCount);
  const visibleReports = filteredReports.slice(
      (safePage - 1) * rowsPerPage,
      safePage * rowsPerPage,
  );

  const setPage = (page) => {
    setCurrentPage(Math.min(Math.max(page, 1), pageCount));
  };

  const changeRowsPerPage = (value) => {
    setRowsPerPage(value);
    setCurrentPage(1);
  };

  const changeSortOrder = (value) => {
    setSortOrder(value);
    setCurrentPage(1);
  };

  const updateModeratorNotes = (reportId, moderatorNotes) => {
    setReports((current) =>
        current.map((report) =>
            (report.reportId === reportId || report.id === reportId) ? { ...report, moderatorNotes } : report,
        ),
    );
  };

  const dismissReport = (reportId) => {
    const report = reports.find((item) => item.reportId === reportId || item.id === reportId);
    if (!report || report.status === "Resolved") return;

    fetch(`http://localhost:8080/api/moderation/reports/${report.reportId || reportId}/status`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("admin_token") || ""}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ status: "Resolved" })
    }).catch(err => console.error("Failed to sync status update to backend:", err));

    setReports((current) =>
        current.map((item) =>
            (item.reportId === reportId || item.id === reportId)
                ? { ...item, status: "Resolved" }
                : item,
        ),
    );
    setResolvedToday((current) => current + 1);
    notify("Report dismissed and marked as resolved.");
  };

  const removeContent = (reportId) => {
    setReports((current) =>
        current.map((item) =>
            (item.reportId === reportId || item.id === reportId) ? { ...item, contentRemoved: true } : item,
        ),
    );
    notify("Reported content removed.");
  };

  const permanentlyBlockUser = (reportId, reason) => {
    const report = reports.find((item) => item.reportId === reportId || item.id === reportId);
    const blockReason = reason?.trim();
    if (!report || !blockReason) return false;

    setReports((current) =>
        current.map((item) =>
            (item.reportId === reportId || item.id === reportId)
                ? { ...item, status: "Blocked" }
                : item,
        ),
    );
    notify("User permanently blocked. Access revoked immediately.");
    return true;
  };

  const unblockUser = (userId) => {
    setBlockedUsers((current) => current.filter((user) => user.id !== userId));
    notify("User unblocked successfully.");
  };

  const viewProfile = (person) => {
    notify(`${person?.name || "User"}'s profile is ready for review.`);
  };

  return {
    reports,
    blockedUsers,
    filters,
    updateFilters,
    clearFilters,
    applySummaryFilter,
    sortOrder,
    changeSortOrder,
    currentPage: safePage,
    setPage,
    rowsPerPage,
    changeRowsPerPage,
    filteredReports,
    visibleReports,
    pageCount,
    resolvedToday,
    referenceTime: moderationReferenceTime,
    summary,
    toast,
    updateModeratorNotes,
    dismissReport,
    removeContent,
    permanentlyBlockUser,
    unblockUser,
    viewProfile,
  };
}