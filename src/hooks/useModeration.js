import { useEffect, useMemo, useRef, useState } from "react";
import {
  defaultModerationFilters,
  moderationBlockedUsers,
  moderationReferenceTime,
  moderationReports,
  moderationSummary,
} from "../data/moderationMockData";

function cloneReports() {
  return moderationReports.map((report) => ({
    ...report,
    reportedUser: { ...report.reportedUser },
    reporter: { ...report.reporter },
    moderationHistory: [...report.moderationHistory],
  }));
}

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
  const [reports, setReports] = useState(cloneReports);
  const [blockedUsers, setBlockedUsers] = useState(() =>
    moderationBlockedUsers.map((user) => ({ ...user })),
  );
  const [filters, setFilters] = useState({ ...defaultModerationFilters });
  const [sortOrder, setSortOrder] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [resolvedToday, setResolvedToday] = useState(
    moderationSummary.resolvedToday,
  );
  const [toast, setToast] = useState("");
  const toastTimer = useRef(null);

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
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({ ...defaultModerationFilters });
    setCurrentPage(1);
  };

  const filteredReports = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    const start = dateBoundary(filters.startDate);
    const end = dateBoundary(filters.endDate, true);

    return reports
      .filter((report) => {
        const searchable = [
          report.id,
          report.contentText,
          report.reportedUser.name,
          report.reportedUser.username,
        ]
          .join(" ")
          .toLowerCase();
        const submitted = new Date(report.submittedAt).getTime();

        return (
          (!query || searchable.includes(query)) &&
          (filters.status === "All" || report.status === filters.status) &&
          (filters.severity === "All" || report.severity === filters.severity) &&
          (!start || submitted >= start) &&
          (!end || submitted <= end)
        );
      })
      .sort((first, second) => {
        const firstDate = new Date(first.submittedAt).getTime();
        const secondDate = new Date(second.submittedAt).getTime();
        return sortOrder === "newest"
          ? secondDate - firstDate
          : firstDate - secondDate;
      });
  }, [filters, reports, sortOrder]);

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
        report.id === reportId ? { ...report, moderatorNotes } : report,
      ),
    );
  };

  const dismissReport = (reportId) => {
    const report = reports.find((item) => item.id === reportId);
    if (!report || report.status === "Resolved") return;
    setReports((current) =>
      current.map((item) =>
        item.id === reportId
          ? {
              ...item,
              status: "Resolved",
              moderationHistory: [
                ...item.moderationHistory,
                {
                  action: "Report dismissed",
                  createdAt: new Date().toISOString(),
                  moderator: "Akshita Sharma",
                },
              ],
            }
          : item,
      ),
    );
    setResolvedToday((current) => current + 1);
    notify("Report dismissed and marked as resolved.");
  };

  const removeContent = (reportId) => {
    setReports((current) =>
      current.map((item) =>
        item.id === reportId
          ? {
              ...item,
              contentRemoved: true,
              moderationHistory: [
                ...item.moderationHistory,
                {
                  action: "Content removed",
                  createdAt: new Date().toISOString(),
                  moderator: "Akshita Sharma",
                },
              ],
            }
          : item,
      ),
    );
    notify("Reported content removed.");
  };

  const permanentlyBlockUser = (reportId) => {
    const report = reports.find((item) => item.id === reportId);
    if (!report || report.reportedUser.accountStatus === "Permanently Blocked") {
      return;
    }
    const blockedAt = new Date().toISOString();

    setReports((current) =>
      current.map((item) =>
        item.reportedUser.id === report.reportedUser.id
          ? {
              ...item,
              status: item.id === reportId ? "Blocked" : item.status,
              reportedUser: {
                ...item.reportedUser,
                accountStatus: "Permanently Blocked",
              },
              moderationHistory:
                item.id === reportId
                  ? [
                      ...item.moderationHistory,
                      {
                        action: "User permanently blocked",
                        createdAt: blockedAt,
                        moderator: "Akshita Sharma",
                      },
                    ]
                  : item.moderationHistory,
            }
          : item,
      ),
    );
    setBlockedUsers((current) =>
      current.some((user) => user.id === report.reportedUser.id)
        ? current
        : [
            {
              ...report.reportedUser,
              accountStatus: "Permanently Blocked",
              reason: `Severe violation reported in ${report.id}`,
              blockedAt,
              blockedBy: "Akshita Sharma",
              status: "Permanently Blocked",
            },
            ...current,
          ],
    );
    notify("User permanently blocked. Access revoked immediately.");
  };

  const unblockUser = (userId) => {
    setBlockedUsers((current) => current.filter((user) => user.id !== userId));
    setReports((current) =>
      current.map((report) =>
        report.reportedUser.id === userId
          ? {
              ...report,
              reportedUser: { ...report.reportedUser, accountStatus: "Active" },
            }
          : report,
      ),
    );
    notify("User unblocked successfully.");
  };

  const viewProfile = (person) => {
    notify(`${person.name}'s profile is ready for review.`);
  };

  return {
    reports,
    blockedUsers,
    filters,
    updateFilters,
    clearFilters,
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
    summary: moderationSummary,
    toast,
    updateModeratorNotes,
    dismissReport,
    removeContent,
    permanentlyBlockUser,
    unblockUser,
    viewProfile,
  };
}
