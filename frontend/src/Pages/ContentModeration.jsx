import { useEffect, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { useModeration } from "../hooks/useModeration.js";
import "./ContentModeration.css";

const statusOptions = ["All", "Pending", "Review", "Approved", "Content Removed", "Blocked", "Resolved"];
const severityOptions = ["All", "High", "Medium", "Low", "Severe"];

function ModerationIcon({ name, size = 20 }) {
    const icons = {
        search: (
            <>
                <circle cx="11" cy="11" r="6" />
                <path d="m16 16 4 4" />
            </>
        ),
        calendar: (
            <>
                <rect x="3" y="5" width="18" height="16" rx="2" />
                <path d="M7 3v4M17 3v4M3 10h18" />
            </>
        ),
        reports: (
            <>
                <path d="M6 3h9l4 4v14H6z" />
                <path d="M14 3v5h5M9 12h7M9 16h7" />
            </>
        ),
        alert: (
            <>
                <path d="M12 3 2.8 20h18.4L12 3Z" />
                <path d="M12 9v5M12 17.5v.1" />
            </>
        ),
        users: (
            <>
                <circle cx="9" cy="8" r="3" />
                <path d="M3 20v-1.5A4.5 4.5 0 0 1 7.5 14h3a4.5 4.5 0 0 1 4.5 4.5V20M16 5.5a3 3 0 0 1 0 5M18 14a4 4 0 0 1 3 4v2" />
            </>
        ),
        check: (
            <>
                <circle cx="12" cy="12" r="9" />
                <path d="m8 12 2.5 2.5L16.5 8" />
            </>
        ),
    };

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            {icons[name]}
        </svg>
    );
}

function formatRelativeTime(value, referenceTime) {
    if (!value) return "Recently";
    const ref = referenceTime ? new Date(referenceTime).getTime() : Date.now();
    const difference = Math.max(0, ref - new Date(value).getTime());
    const minutes = Math.floor(difference / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} ${days === 1 ? "day" : "days"} ago`;
    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(new Date(value));
}

function toIsoDate(value) {
    if (!value) return "";
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function parseIsoDate(value) {
    if (!value) return undefined;
    const [year, month, day] = value.split("-").map(Number);
    if (!year || !month || !day) return undefined;
    return new Date(year, month - 1, day);
}

function Avatar({ person, compact = false }) {
    return (
        <span
            className={`moderation-avatar${compact ? " is-compact" : ""}`}
            aria-hidden="true"
        >
      {person?.initials || "U"}
    </span>
    );
}

function SeverityBadge({ severity }) {
    const symbol = {
        Severe: "▲",
        High: "!",
        Medium: "◆",
        Low: "●",
    }[severity] || "?";

    return (
        <span className={`moderation-badge severity-${(severity || "low").toLowerCase()}`}>
      <span aria-hidden="true">{symbol}</span>
            {severity || "Low"}
    </span>
    );
}

function StatusBadge({ status }) {
    const normalized = (status || "pending").toLowerCase().replace(/\s+/g, "-");
    return (
        <span className={`moderation-badge status-${normalized}`}>
      <span aria-hidden="true">●</span>
            {status || "Pending"}
    </span>
    );
}

function ModerationStats({
                             summary,
                             blockedCount,
                             resolvedToday,
                             onViewReports,
                             onViewBlocked,
                         }) {
    const cards = [
        {
            id: "open",
            label: "Open Reports",
            value: summary?.openReports || 0,
            icon: "reports",
            tone: "blue",
            detail: `↓ ${summary?.openReportsChange || 0}%`,
            caption: "vs. last week",
            action: () => onViewReports("open"),
            actionLabel: "View",
        },
        {
            id: "critical",
            label: "Critical Reports",
            value: summary?.criticalReports || 0,
            icon: "alert",
            tone: "red",
            detail: `↑ ${summary?.criticalReportsToday || 0} today`,
            caption: "Requires immediate attention",
            action: () => onViewReports("critical"),
            actionLabel: "View",
        },
        {
            id: "blocked",
            label: "Blocked Users Today",
            value: blockedCount,
            icon: "users",
            tone: "blue",
            detail: "↑ 133%",
            caption: "vs. yesterday",
            action: onViewBlocked,
            actionLabel: "View Blocked Users",
        },
        {
            id: "resolved",
            label: "Resolved Today",
            value: resolvedToday,
            icon: "check",
            tone: "green",
            detail: "On track",
            caption: "Moderation queue",
            action: () => onViewReports("resolved"),
            actionLabel: "View",
        },
    ];

    return (
        <section className="moderation-stats" aria-label="Moderation summary">
            {cards.map((card) => (
                <article className={`moderation-stat stat-${card.tone}`} key={card.id}>
          <span className="moderation-stat-icon">
            <ModerationIcon name={card.icon} size={28} />
          </span>
                    <div className="moderation-stat-copy">
                        <span>{card.label}</span>
                        <strong>{card.value}</strong>
                        <b>{card.detail}</b>
                        <small>{card.caption}</small>
                    </div>
                    {card.action && (
                        <button className="moderation-stat-action" type="button" onClick={card.action}>
                            {card.actionLabel}
                        </button>
                    )}
                </article>
            ))}
        </section>
    );
}

function DateFilter({ filters, updateFilters }) {
    const [isOpen, setIsOpen] = useState(false);
    const [showCalendar, setShowCalendar] = useState(false);
    const [draftRange, setDraftRange] = useState({
        from: parseIsoDate(filters.startDate),
        to: parseIsoDate(filters.endDate),
    });
    const pickerRef = useRef(null);

    useEffect(() => {
        setDraftRange({
            from: parseIsoDate(filters.startDate),
            to: parseIsoDate(filters.endDate),
        });
    }, [filters.startDate, filters.endDate]);

    useEffect(() => {
        if (!isOpen) return undefined;
        const closeOnOutside = (event) => {
            if (!pickerRef.current?.contains(event.target)) setIsOpen(false);
        };
        const closeOnEscape = (event) => {
            if (event.key === "Escape") setIsOpen(false);
        };
        document.addEventListener("pointerdown", closeOnOutside);
        document.addEventListener("keydown", closeOnEscape);
        return () => {
            document.removeEventListener("pointerdown", closeOnOutside);
            document.removeEventListener("keydown", closeOnEscape);
        };
    }, [isOpen]);

    const choosePreset = (preset) => {
        if (preset === "all") {
            updateFilters({ datePreset: "all", startDate: "", endDate: "" });
            setDraftRange({ from: undefined, to: undefined });
            setIsOpen(false);
            setShowCalendar(false);
            return;
        }

        const now = new Date();
        const todayStr = toIsoDate(now);

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);

        const ranges = {
            today: [todayStr, todayStr],
            "7days": [toIsoDate(sevenDaysAgo), todayStr],
            "30days": [toIsoDate(thirtyDaysAgo), todayStr],
        };

        const [startDate, endDate] = ranges[preset] || ["", ""];
        updateFilters({ datePreset: preset, startDate, endDate });
        setDraftRange({ from: parseIsoDate(startDate), to: parseIsoDate(endDate) });
        setIsOpen(false);
        setShowCalendar(false);
    };

    const applyCustomRange = () => {
        if (!draftRange.from || !draftRange.to) return;
        updateFilters({
            datePreset: "custom",
            startDate: toIsoDate(draftRange.from),
            endDate: toIsoDate(draftRange.to),
        });
        setIsOpen(false);
        setShowCalendar(false);
    };

    const labels = {
        all: "All Dates",
        today: "Today",
        "7days": "Last 7 days",
        "30days": "Last 30 days",
    };

    const customLabel =
        filters.startDate && filters.endDate
            ? `${new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
                parseIsoDate(filters.startDate) || new Date(),
            )} – ${new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
                parseIsoDate(filters.endDate) || new Date(),
            )}`
            : "All Dates";

    const controlLabel = (!filters.startDate && !filters.endDate)
        ? "All Dates"
        : (labels[filters.datePreset] ?? customLabel);

    return (
        <div className="moderation-date-filter" ref={pickerRef}>
            <button
                className="moderation-filter-control date-filter-button"
                type="button"
                onClick={() => setIsOpen((current) => !current)}
                aria-expanded={isOpen}
                aria-haspopup="dialog"
            >
                <ModerationIcon name="calendar" size={17} />
                <span>{controlLabel}</span>
                <span aria-hidden="true">⌄</span>
            </button>
            {isOpen && (
                <div className="moderation-date-popover" role="dialog" aria-label="Filter by date range">
                    <div className="date-quick-options">
                        {[
                            ["all", "All Dates"],
                            ["today", "Today"],
                            ["7days", "Last 7 days"],
                            ["30days", "Last 30 days"],
                        ].map(([value, label]) => (
                            <button
                                className={filters.datePreset === value ? "is-selected" : ""}
                                type="button"
                                onClick={() => choosePreset(value)}
                                key={value}
                            >
                                {label}
                            </button>
                        ))}
                        <button
                            className={filters.datePreset === "custom" ? "is-selected" : ""}
                            type="button"
                            onClick={() => setShowCalendar(true)}
                        >
                            Custom Range
                        </button>
                    </div>
                    {showCalendar && (
                        <>
                            <DayPicker
                                mode="range"
                                selected={draftRange}
                                onSelect={(range) => setDraftRange(range ?? {})}
                                defaultMonth={draftRange.from || new Date()}
                                min={0}
                                showOutsideDays
                            />
                            <div className="moderation-date-actions">
                                <button type="button" onClick={() => setIsOpen(false)}>
                                    Cancel
                                </button>
                                <button
                                    className="is-primary"
                                    type="button"
                                    onClick={applyCustomRange}
                                    disabled={!draftRange.from || !draftRange.to}
                                >
                                    Apply
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

function ModerationFilters({ filters, updateFilters, clearFilters }) {
    return (
        <section className="moderation-filters" aria-label="Report filters">
            <label className="moderation-filter-field search-field">
                <span>Search</span>
                <span className="moderation-search-control">
          <ModerationIcon name="search" size={17} />
          <input
              type="search"
              value={filters.search}
              onChange={(event) => updateFilters({ search: event.target.value })}
              placeholder="Search content, user, or report ID..."
          />
        </span>
            </label>
            <label className="moderation-filter-field">
                <span>Status</span>
                <select
                    value={filters.status}
                    onChange={(event) => updateFilters({ status: event.target.value })}
                >
                    {statusOptions.map((option) => (
                        <option value={option} key={option}>
                            {option}
                        </option>
                    ))}
                </select>
            </label>
            <label className="moderation-filter-field">
                <span>Severity</span>
                <select
                    value={filters.severity}
                    onChange={(event) => updateFilters({ severity: event.target.value })}
                >
                    {severityOptions.map((option) => (
                        <option value={option} key={option}>
                            {option}
                        </option>
                    ))}
                </select>
            </label>
            <div className="moderation-filter-field">
                <span>Date Range</span>
                <DateFilter filters={filters} updateFilters={updateFilters} />
            </div>
            <button className="clear-filters" type="button" onClick={clearFilters}>
                Clear Filters
            </button>
        </section>
    );
}

function ReportsTable({
                          reports,
                          totalReports,
                          currentPage,
                          pageCount,
                          rowsPerPage,
                          sortOrder,
                          referenceTime,
                          onSort,
                          onPage,
                          onRowsPerPage,
                          onOpenReport,
                      }) {
    const firstRow = totalReports === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
    const lastRow = Math.min(currentPage * rowsPerPage, totalReports);

    return (
        <section className="moderation-table-card">
            <div className="moderation-table-heading">
                <h2>Reports ({totalReports})</h2>
                <label className="moderation-sort">
                    <span>Sort by:</span>
                    <select value={sortOrder} onChange={(event) => onSort(event.target.value)}>
                        <option value="newest">Newest</option>
                        <option value="oldest">Oldest</option>
                    </select>
                </label>
            </div>
            {reports.length === 0 ? (
                <div className="moderation-empty-state">
                    <strong>No reports found</strong>
                    <span>Try changing your search or clearing the filters.</span>
                </div>
            ) : (
                <div className="moderation-table-scroll">
                    <table className="moderation-table">
                        <thead>
                        <tr>
                            <th scope="col">#</th>
                            <th scope="col">Report ID</th>
                            <th scope="col">Content</th>
                            <th scope="col">Reported User</th>
                            <th scope="col">Reporter</th>
                            <th scope="col">Severity</th>
                            <th scope="col">Submitted</th>
                            <th scope="col">Status</th>
                            <th scope="col">Action</th>
                        </tr>
                        </thead>
                        <tbody>
                        {reports.map((report, index) => {
                            const reportId = report.reportId || report.id;
                            const contentText = report.contentText || report.contentSnippet || "No content summary";
                            const reportedUser = report.reportedUser || { name: "User", username: "@user", initials: "U" };
                            const reporter = report.reporter || { name: "Reporter" };
                            return (
                                <tr key={reportId}>
                                    <td>{(currentPage - 1) * rowsPerPage + index + 1}</td>
                                    <td>
                                        <strong>{reportId}</strong>
                                    </td>
                                    <td>
                                        <div className="report-content-cell">
                                            {report.contentImage && <img src={report.contentImage} alt="" />}
                                            <span>{contentText}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="reported-user-cell">
                                            <Avatar person={reportedUser} compact />
                                            <span>
                          <strong>{reportedUser?.name}</strong>
                          <small>{reportedUser?.username}</small>
                        </span>
                                        </div>
                                    </td>
                                    <td>{reporter?.name}</td>
                                    <td>
                                        <SeverityBadge severity={report.severity} />
                                    </td>
                                    <td>{formatRelativeTime(report.submittedAt || report.createdAt, referenceTime)}</td>
                                    <td>
                                        <StatusBadge status={report.status} />
                                    </td>
                                    <td>
                                        <button
                                            className="review-report-button"
                                            type="button"
                                            onClick={() => onOpenReport(reportId)}
                                        >
                                            {report.status === "Pending" || report.status === "Review"
                                                ? "Review"
                                                : "View"}
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>
            )}
            <div className="moderation-pagination">
        <span>
          Showing {firstRow}–{lastRow} of {totalReports} reports
        </span>
                <div className="page-buttons" aria-label="Report pages">
                    <button
                        type="button"
                        onClick={() => onPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        aria-label="Previous page"
                    >
                        ‹
                    </button>
                    {Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => (
                        <button
                            className={page === currentPage ? "is-current" : ""}
                            type="button"
                            onClick={() => onPage(page)}
                            aria-current={page === currentPage ? "page" : undefined}
                            key={page}
                        >
                            {page}
                        </button>
                    ))}
                    <button
                        type="button"
                        onClick={() => onPage(currentPage + 1)}
                        disabled={currentPage === pageCount}
                        aria-label="Next page"
                    >
                        ›
                    </button>
                </div>
                <label className="rows-per-page">
                    Rows per page:
                    <select
                        value={rowsPerPage}
                        onChange={(event) => onRowsPerPage(Number(event.target.value))}
                    >
                        <option value="10">10</option>
                        <option value="15">15</option>
                        <option value="20">20</option>
                    </select>
                </label>
            </div>
        </section>
    );
}

function PersonDetails({ title, person, onViewProfile, children }) {
    const safePerson = person || { name: "Unknown", username: "@user", initials: "U" };
    return (
        <section className="drawer-section">
            <h3>{title}</h3>
            <div className="drawer-person">
                <Avatar person={safePerson} />
                <div>
                    <strong>{safePerson?.name}</strong>
                    <span>{safePerson?.username}</span>
                    {children}
                </div>
                <button
                    className="view-profile-button"
                    type="button"
                    onClick={() => onViewProfile(safePerson)}
                >
                    View profile
                </button>
            </div>
        </section>
    );
}

function ReportDrawer({
                          report,
                          referenceTime,
                          onClose,
                          onNotes,
                          onApprove,
                          onRemove,
                          onStatusChange,
                          onBlock,
                          onViewProfile,
                      }) {
    const [showBlockReason, setShowBlockReason] = useState(false);
    const [blockReason, setBlockReason] = useState("");
    const [blockError, setBlockError] = useState("");
    const [notesDraft, setNotesDraft] = useState("");
    const [isSavingNote, setIsSavingNote] = useState(false);
    const [noteSavedFeedback, setNoteSavedFeedback] = useState("");

    const reportId = report?.reportId || report?.id;

    useEffect(() => {
        setNotesDraft("");
        setNoteSavedFeedback("");
    }, [reportId]);

    useEffect(() => {
        const closeOnEscape = (event) => {
            if (
                event.key === "Escape" &&
                !document.querySelector(".moderation-date-popover, .blocked-users-modal")
            ) {
                onClose();
            }
        };
        document.addEventListener("keydown", closeOnEscape);
        return () => document.removeEventListener("keydown", closeOnEscape);
    }, [onClose]);

    if (!report) return null;
    const reportedUser = report.reportedUser || { name: "User", username: "@user", initials: "U", accountStatus: "Active" };
    const isBlocked = reportedUser?.accountStatus === "Permanently Blocked";
    const isApproved = report.status === "Approved";
    const isContentRemoved = report.contentRemoved || report.status === "Content Removed";

    const confirmBlock = () => {
        const reason = blockReason.trim();
        if (!reason) {
            setBlockError("Please provide a reason for blocking this user.");
            return;
        }

        if (onBlock(reportId, reason)) {
            setShowBlockReason(false);
            setBlockReason("");
            setBlockError("");
        }
    };

    const handleSaveNotes = async () => {
        if (!notesDraft.trim()) return;
        setIsSavingNote(true);
        try {
            await onNotes(reportId, notesDraft.trim());
            setNotesDraft("");
            setNoteSavedFeedback("Note saved to database!");
            setTimeout(() => setNoteSavedFeedback(""), 3000);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSavingNote(false);
        }
    };

    return (
        <aside className="report-drawer" aria-label={`Review ${reportId}`}>
            <div className="drawer-header">
                <div>
                    <h2>{reportId}</h2>
                    <div>
                        <SeverityBadge severity={report.severity} />
                        <StatusBadge status={report.status} />
                    </div>
                </div>
                <button className="drawer-close" type="button" onClick={onClose} aria-label="Close report details">
                    ×
                </button>
            </div>

            <section className="drawer-section">
                <h3>Reported Content</h3>
                <div className={`drawer-content-preview${isContentRemoved ? " is-removed" : ""}`}>
                    {report.contentImage && <img src={report.contentImage} alt="Reported travel content" />}
                    <div>
                        <span>{isContentRemoved ? "Content removed" : (report.contentText || report.contentSnippet)}</span>
                        <small>
                            {formatRelativeTime(report.submittedAt || report.createdAt, referenceTime)} · {report.reportCount || 1} reports
                        </small>
                    </div>
                </div>
            </section>

            <section className="drawer-section report-information">
                <h3>Report Information</h3>
                <div>
                    <span>Submitted</span>
                    <strong>{formatRelativeTime(report.submittedAt || report.createdAt, referenceTime)}</strong>
                </div>
                <div>
                    <span>Content ID</span>
                    <strong>{report.contentId || "N/A"}</strong>
                </div>
            </section>

            <PersonDetails
                title="Reporter"
                person={report.reporter}
                onViewProfile={onViewProfile}
            >
                <small>Previous reports: {report.reporter?.previousReports || 0}</small>
            </PersonDetails>

            <PersonDetails
                title="Reported User"
                person={reportedUser}
                onViewProfile={onViewProfile}
            >
                <small>
                    Account status: <b>{reportedUser?.accountStatus || "Active"}</b>
                </small>
                <small>Previous violations: {reportedUser?.previousReports || 0}</small>
            </PersonDetails>

            {/* Reversible Status Controls: Allows changing status to any value anytime */}
            <section className="drawer-section">
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569", display: "block", marginBottom: "6px" }}>
                    Current Status:
                </label>
                <select
                    value={report.status || "Pending"}
                    onChange={(e) => onStatusChange(reportId, e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", background: "#fff", color: "#1e293b", fontWeight: "500" }}
                >
                    <option value="Pending">Pending</option>
                    <option value="Review">Under Review</option>
                    <option value="Approved">Approved</option>
                    <option value="Content Removed">Content Removed</option>
                    <option value="Resolved">Resolved</option>
                </select>
            </section>

            <section className="drawer-section">
                <label className="moderator-notes">
                    <span>Moderator Notes</span>
                    <textarea
                        value={notesDraft}
                        onChange={(event) => setNotesDraft(event.target.value)}
                        placeholder="Add internal moderation notes..."
                    />
                </label>
                <div style={{ marginTop: "10px" }}>
                    <button
                        type="button"
                        className="drawer-secondary-action"
                        style={{ width: "100%" }}
                        onClick={handleSaveNotes}
                        disabled={isSavingNote || !notesDraft.trim()}
                    >
                        {isSavingNote ? "Saving Note..." : "Save Note"}
                    </button>
                </div>

                {noteSavedFeedback && (
                    <div style={{ marginTop: "8px", fontSize: "12px", color: "#16a34a", fontWeight: "600", textAlign: "center" }}>
                        ✓ {noteSavedFeedback}
                    </div>
                )}

                {report.moderatorNotes && (
                    <div style={{ marginTop: "12px", padding: "10px 12px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", color: "#64748b", display: "block", marginBottom: "4px" }}>
              Saved Note(s):
            </span>
                        <p style={{ fontSize: "13px", color: "#1e293b", margin: 0, whiteSpace: "pre-wrap", lineHeight: "1.4" }}>
                            {report.moderatorNotes}
                        </p>
                    </div>
                )}
            </section>

            {/* Action buttons: Always clickable so choices can be reversed or updated */}
            <div className="drawer-actions">
                <button
                    className="drawer-secondary-action"
                    type="button"
                    onClick={() => onApprove(reportId)}
                    style={isApproved ? { background: "#dcfce7", color: "#15803d", borderColor: "#86efac" } : {}}
                >
                    {isApproved ? "✓ Content Approved" : "Approve Content"}
                </button>
                <button
                    className="drawer-secondary-action"
                    type="button"
                    onClick={() => onRemove(reportId)}
                    style={isContentRemoved ? { background: "#fee2e2", color: "#b91c1c", borderColor: "#fca5a5" } : {}}
                >
                    {isContentRemoved ? "✓ Content Removed" : "Remove Content"}
                </button>
                <button
                    className="drawer-danger-action"
                    type="button"
                    onClick={() => {
                        setShowBlockReason(true);
                        setBlockError("");
                    }}
                    disabled={isBlocked}
                >
                    {isBlocked ? "User Permanently Blocked" : "Permanently Block User"}
                </button>
                {showBlockReason && !isBlocked && (
                    <div className="block-reason-panel">
                        <label htmlFor={`block-reason-${reportId}`}>
                            Reason for blocking
                        </label>
                        <textarea
                            id={`block-reason-${reportId}`}
                            value={blockReason}
                            onChange={(event) => {
                                setBlockReason(event.target.value);
                                if (blockError) setBlockError("");
                            }}
                            placeholder="Enter the reason for permanently blocking this user"
                            aria-invalid={Boolean(blockError)}
                            aria-describedby={blockError ? `block-error-${reportId}` : undefined}
                        />
                        {blockError && (
                            <span id={`block-error-${reportId}`} role="alert">
                {blockError}
              </span>
                        )}
                        <div>
                            <button
                                className="drawer-secondary-action"
                                type="button"
                                onClick={() => {
                                    setShowBlockReason(false);
                                    setBlockReason("");
                                    setBlockError("");
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                className="drawer-danger-action"
                                type="button"
                                onClick={confirmBlock}
                            >
                                Confirm Block
                            </button>
                        </div>
                    </div>
                )}
                <p>▲ This action cannot be undone.</p>
            </div>
        </aside>
    );
}

function BlockedUsersModal({ users, referenceTime, onClose, onUnblock }) {
    useEffect(() => {
        const closeOnEscape = (event) => {
            if (event.key === "Escape") onClose();
        };
        document.addEventListener("keydown", closeOnEscape);
        return () => document.removeEventListener("keydown", closeOnEscape);
    }, [onClose]);

    return (
        <div className="blocked-modal-backdrop" role="presentation" onMouseDown={onClose}>
            <section
                className="blocked-users-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="blocked-users-title"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="blocked-modal-header">
                    <div>
                        <span>Safety controls</span>
                        <h2 id="blocked-users-title">Blocked Users</h2>
                    </div>
                    <button type="button" onClick={onClose} aria-label="Close blocked users">
                        ×
                    </button>
                </div>
                {!Array.isArray(users) || users.length === 0 ? (
                    <div className="moderation-empty-state">
                        <strong>No blocked users</strong>
                        <span>Users blocked during moderation will appear here.</span>
                    </div>
                ) : (
                    <div className="blocked-users-list">
                        {users.map((user, index) => (
                            <article key={user.id || index}>
                                <span className="blocked-user-rank">{index + 1}</span>
                                <Avatar person={user} />
                                <div className="blocked-user-identity">
                                    <strong>{user.name}</strong>
                                    <span>{user.username}</span>
                                </div>
                                <div>
                                    <span>Reason</span>
                                    <strong>{user.reason}</strong>
                                </div>
                                <div>
                                    <span>Blocked</span>
                                    <strong>{formatRelativeTime(user.blockedAt, referenceTime)}</strong>
                                </div>
                                <div>
                                    <span>Blocked by</span>
                                    <strong>{user.blockedBy}</strong>
                                </div>
                                <span className="blocked-status">● {user.status}</span>
                                <button type="button" onClick={() => onUnblock(user.id)}>
                                    Unblock
                                </button>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

function ContentModeration() {
    const moderation = useModeration();
    const [selectedReportId, setSelectedReportId] = useState(null);
    const [showBlockedUsers, setShowBlockedUsers] = useState(false);
    const reportsSectionRef = useRef(null);

    const displayReports = moderation.filteredReports;
    const totalCount = moderation.filteredReports.length;

    const selectedReport = displayReports.find(
        (report) => (report.reportId || report.id) === selectedReportId,
    );

    const viewReportGroup = (filter) => {
        moderation.applySummaryFilter(filter);
        setSelectedReportId(null);
        window.requestAnimationFrame(() => {
            reportsSectionRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        });
    };

    return (
        <main className="moderation-content">
            <div className="moderation-breadcrumb">
                <span>Admin</span>
                <span aria-hidden="true">/</span>
                <strong>Content Moderation</strong>
            </div>
            <header className="moderation-page-header">
                <h1>Content Moderation</h1>
                <p>
                    Review reported content and take moderation actions to keep TourBhook safe and authentic.
                </p>
            </header>

            <ModerationStats
                summary={moderation.summary}
                blockedCount={Array.isArray(moderation.blockedUsers) ? moderation.blockedUsers.length : 0}
                resolvedToday={moderation.resolvedToday}
                onViewReports={viewReportGroup}
                onViewBlocked={() => setShowBlockedUsers(true)}
            />
            <ModerationFilters
                filters={moderation.filters}
                updateFilters={moderation.updateFilters}
                clearFilters={moderation.clearFilters}
            />
            <div
                className={`moderation-review-layout${selectedReport ? " has-drawer" : ""}`}
                ref={reportsSectionRef}
            >
                <ReportsTable
                    reports={moderation.visibleReports}
                    totalReports={totalCount}
                    currentPage={moderation.currentPage}
                    pageCount={moderation.pageCount}
                    rowsPerPage={moderation.rowsPerPage}
                    sortOrder={moderation.sortOrder}
                    referenceTime={moderation.referenceTime}
                    onSort={moderation.changeSortOrder}
                    onPage={moderation.setPage}
                    onRowsPerPage={moderation.changeRowsPerPage}
                    onOpenReport={setSelectedReportId}
                />
                {selectedReport && (
                    <ReportDrawer
                        key={selectedReport.reportId || selectedReport.id}
                        report={selectedReport}
                        referenceTime={moderation.referenceTime}
                        onClose={() => setSelectedReportId(null)}
                        onNotes={moderation.updateModeratorNotes}
                        onApprove={moderation.approveContent}
                        onRemove={moderation.removeContent}
                        onStatusChange={moderation.updateReportStatus}
                        onBlock={moderation.permanentlyBlockUser}
                        onViewProfile={moderation.viewProfile}
                    />
                )}
            </div>

            {showBlockedUsers && (
                <BlockedUsersModal
                    users={moderation.blockedUsers}
                    referenceTime={moderation.referenceTime}
                    onClose={() => setShowBlockedUsers(false)}
                    onUnblock={moderation.unblockUser}
                />
            )}
            {moderation.toast && (
                <div className="moderation-toast" role="status">
                    ✓ {moderation.toast}
                </div>
            )}
        </main>
    );
}

export default ContentModeration;