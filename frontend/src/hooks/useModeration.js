import { useEffect, useRef, useState, useMemo } from "react";
import { moderationReferenceTime } from "../data/moderationMockData";

export const defaultModerationFilters = {
    search: "",
    status: "All",
    severity: "All",
    datePreset: "all",
    startDate: "",
    endDate: "",
};

export function useModeration() {
    const [reports, setReports] = useState([]);
    const [summary, setSummary] = useState({ openReports: 0, criticalReports: 0, openReportsChange: 0, criticalReportsToday: 0 });
    const [resolvedToday, setResolvedToday] = useState(0);
    const [blockedUsers, setBlockedUsers] = useState([]);
    const [filters, setFilters] = useState({ ...defaultModerationFilters });
    const [debouncedSearch, setDebouncedSearch] = useState(filters.search);
    const [summaryFilter, setSummaryFilter] = useState(null);
    const [sortOrder, setSortOrder] = useState("newest");
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [toast, setToast] = useState("");
    const toastTimer = useRef(null);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(filters.search);
        }, 300);
        return () => clearTimeout(handler);
    }, [filters.search]);

    // Live fetch from Spring Boot whenever filters change
    useEffect(() => {
        const token = localStorage.getItem("admin_token");
        const queryParams = new URLSearchParams({
            search: debouncedSearch || "",
            status: filters.status || "All",
            severity: filters.severity || "All",
            startDate: filters.startDate || "",
            endDate: filters.endDate || "",
        });

        fetch(`http://localhost:8080/api/moderation/reports?${queryParams.toString()}`, {
            headers: {
                "Authorization": token ? `Bearer ${token}` : "",
                "Content-Type": "application/json",
            },
        })
            .then((res) => {
                if (!res.ok) throw new Error("Failed to fetch moderation reports");
                return res.json();
            })
            .then((data) => {
                if (data && data.success) {
                    setReports(Array.isArray(data.reports) ? data.reports : []);
                    if (data.summary) setSummary(data.summary);
                    if (data.resolvedToday !== undefined) setResolvedToday(data.resolvedToday);
                    if (Array.isArray(data.blockedUsers)) setBlockedUsers(data.blockedUsers);
                }
            })
            .catch((err) => {
                console.warn("Backend moderation fetch failed:", err);
            });
    }, [debouncedSearch, filters.status, filters.severity, filters.startDate, filters.endDate]);

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
        setFilters({
            search: "",
            status: "All",
            severity: "All",
            datePreset: "all",
            startDate: "",
            endDate: "",
        });
        setSummaryFilter(null);
        setCurrentPage(1);
    };

    const applySummaryFilter = (filter) => {
        setSummaryFilter(filter);
        if (filter === "open") {
            // When clicking Open Reports, set status filter to show only Pending/Review
            setFilters((current) => ({
                ...current,
                status: "Open",
                severity: "All",
            }));
        } else {
            setFilters((current) => ({
                ...current,
                severity: filter === "critical" ? "Severe" : "All",
                status: filter === "resolved" ? "Resolved" : "All",
            }));
        }
        setCurrentPage(1);
    };

    const filteredReports = useMemo(() => {
        const query = filters.search.trim().toLowerCase();

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

                // If summary filter is 'open', strictly exclude resolved, approved, content removed, or blocked items
                if (summaryFilter === "open") {
                    const st = (report.status || "").toLowerCase();
                    if (st === "resolved" || st === "approved" || st === "content removed" || st === "blocked") {
                        return false;
                    }
                }

                return !query || searchable.includes(query);
            })
            .sort((first, second) => {
                const firstDate = new Date(first.submittedAt || first.createdAt || 0).getTime();
                const secondDate = new Date(second.submittedAt || second.createdAt || 0).getTime();
                return sortOrder === "newest" ? secondDate - firstDate : firstDate - secondDate;
            });
    }, [filters.search, reports, sortOrder, summaryFilter]);

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

    const updateModeratorNotes = async (reportId, moderatorNotes) => {
        try {
            const token = localStorage.getItem("admin_token");
            const res = await fetch(`http://localhost:8080/api/moderation/reports/${reportId}/notes`, {
                method: "POST",
                headers: {
                    "Authorization": token ? `Bearer ${token}` : "",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ moderatorNotes }),
            });
            const data = await res.json();
            if (data && data.success) {
                setReports((current) =>
                    current.map((report) => {
                        if (report.reportId === reportId || report.id === reportId) {
                            const existingNotes = report.moderatorNotes
                                ? `${report.moderatorNotes}\n${moderatorNotes}`
                                : moderatorNotes;
                            return {
                                ...report,
                                moderatorNotes: existingNotes,
                            };
                        }
                        return report;
                    })
                );
                notify("Moderator note saved to database.");
                return true;
            }
        } catch (err) {
            console.error("Failed to persist moderator notes:", err);
            notify("Error saving note to database.");
        }
    };

    const approveContent = async (reportId) => {
        try {
            const token = localStorage.getItem("admin_token");
            const res = await fetch(`http://localhost:8080/api/moderation/reports/${reportId}/approve`, {
                method: "POST",
                headers: { "Authorization": token ? `Bearer ${token}` : "", "Content-Type": "application/json" },
            });
            const data = await res.json();
            if (data && data.success) {
                setReports((current) =>
                    current.map((item) => (item.reportId === reportId || item.id === reportId) ? { ...item, status: "Approved", contentRemoved: false } : item)
                );
                setResolvedToday((current) => current + 1);
                setSummary((current) => ({ ...current, openReports: Math.max(0, current.openReports - 1) }));
                notify("Content approved. Database updated immediately.");
                return true;
            }
        } catch (err) {
            console.error("Approval failed:", err);
        }
    };

    const removeContent = async (reportId) => {
        try {
            const token = localStorage.getItem("admin_token");
            const res = await fetch(`http://localhost:8080/api/moderation/reports/${reportId}/remove-content`, {
                method: "POST",
                headers: { "Authorization": token ? `Bearer ${token}` : "", "Content-Type": "application/json" },
            });
            const data = await res.json();
            if (data && data.success) {
                setReports((current) =>
                    current.map((item) => (item.reportId === reportId || item.id === reportId) ? { ...item, contentRemoved: true, status: "Content Removed" } : item)
                );
                setResolvedToday((current) => current + 1);
                setSummary((current) => ({ ...current, openReports: Math.max(0, current.openReports - 1) }));
                notify("Content removed. Database updated immediately.");
                return true;
            }
        } catch (err) {
            console.error("Content removal failed:", err);
        }
    };

    const updateReportStatus = async (reportId, newStatus) => {
        try {
            const token = localStorage.getItem("admin_token");
            const res = await fetch(`http://localhost:8080/api/moderation/reports/${reportId}/status`, {
                method: "POST",
                headers: { "Authorization": token ? `Bearer ${token}` : "", "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });
            const data = await res.json();
            if (data && data.success) {
                setReports((current) =>
                    current.map((item) => (item.reportId === reportId || item.id === reportId) ? { ...item, status: newStatus } : item)
                );
                notify(`Report status updated to ${newStatus}.`);
                return true;
            }
        } catch (err) {
            console.error("Status update failed:", err);
        }
    };

    const permanentlyBlockUser = async (reportId, reason) => {
        const blockReason = reason?.trim();
        if (!blockReason) return false;

        try {
            const token = localStorage.getItem("admin_token");
            const res = await fetch(`http://localhost:8080/api/moderation/reports/${reportId}/block-user`, {
                method: "POST",
                headers: { "Authorization": token ? `Bearer ${token}` : "", "Content-Type": "application/json" },
                body: JSON.stringify({ reason: blockReason }),
            });
            const data = await res.json();
            if (data && data.success) {
                setReports((current) =>
                    current.map((item) =>
                        (item.reportId === reportId || item.id === reportId)
                            ? { ...item, status: "Blocked", reportedUser: { ...(item.reportedUser || {}), accountStatus: "Permanently Blocked" } }
                            : item
                    )
                );
                setSummary((current) => ({ ...current, openReports: Math.max(0, current.openReports - 1) }));
                notify("User permanently blocked. Access revoked immediately.");
                return true;
            }
        } catch (err) {
            console.error("Block user failed:", err);
        }
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
        approveContent,
        removeContent,
        updateReportStatus,
        permanentlyBlockUser,
        unblockUser,
        viewProfile,
    };
}