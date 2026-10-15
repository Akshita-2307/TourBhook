import { useEffect, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { initialKycSubmissions } from "../data/kyc/kycData.js";
import { moderationReports } from "../data/moderationMockData";
import ContentModeration from "./ContentModeration.jsx";
import KycApprovals from "./KycApprovals.jsx";
import SystemConfiguration from "./SystemConfiguration.jsx";
import "./Dashboard.css";

const numberFormatter = new Intl.NumberFormat("en-US");
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function Icon({ name, size = 22 }) {
  const icons = {
    search: (
        <>
          <circle cx="11" cy="11" r="6" />
          <path d="m16 16 4 4" />
        </>
    ),
    home: (
        <>
          <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10Z" />
          <path d="M9 21v-7h6v7" />
        </>
    ),
    shield: (
        <>
          <path d="M12 3 4 6v5c0 5 3.4 8.4 8 10 4.6-1.6 8-5 8-10V6l-8-3Z" />
          <path d="m8.5 12 2.2 2.2 4.8-5" />
        </>
    ),
    approval: (
        <>
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <path d="M8 3.5h8M8 11l2 2 5-5" />
        </>
    ),
    settings: (
        <>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.1 2.1-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-3v-.2a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1-2.1-2.1.1-.1A1.7 1.7 0 0 0 7 15a1.7 1.7 0 0 0-1.6-1H5.2v-3h.2A1.7 1.7 0 0 0 7 10a1.7 1.7 0 0 0-.3-1.9l-.1-.1 2.1-2.1.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6v-.2h3v.2a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1 2.1 2.1-.1.1A1.7 1.7 0 0 0 19.4 10a1.7 1.7 0 0 0 1.6 1h.2v3H21a1.7 1.7 0 0 0-1.6 1Z" />
        </>
    ),
    logout: (
        <>
          <path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5" />
          <path d="m15 16 4-4-4-4M19 12H9" />
        </>
    ),
    users: (
        <>
          <path d="M15 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20" />
          <circle cx="9" cy="7" r="3.5" />
          <path d="M17 11a3 3 0 1 0-1-5.8M21 20v-1.5a4 4 0 0 0-2.7-3.8" />
        </>
    ),
    userPlus: (
        <>
          <path d="M14 20v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20" />
          <circle cx="8" cy="7" r="3.5" />
          <path d="M18 8v6M15 11h6" />
        </>
    ),
    group: (
        <>
          <circle cx="8.5" cy="8" r="3.5" />
          <path d="M2.5 20v-1a4.5 4.5 0 0 1 4.5-4.5h3A4.5 4.5 0 0 1 14.5 19v1M16 5.3a3.5 3.5 0 0 1 0 5.4M17 14.6a4.5 4.5 0 0 1 4 4.4v1" />
        </>
    ),
    location: (
        <>
          <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
          <circle cx="12" cy="10" r="2.5" />
        </>
    ),
    calendar: (
        <>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M7 3v4M17 3v4M3 10h18" />
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

function Sparkline({ values }) {
  if (!Array.isArray(values) || values.length === 0) return null;
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const range = Math.max(maximum - minimum, 1);
  const points = values
      .map((value, index) => {
        const x = (index / Math.max(values.length - 1, 1)) * 78 + 1;
        const y = 29 - ((value - minimum) / range) * 23;
        return `${x},${y}`;
      })
      .join(" ");

  return (
      <svg className="sparkline" viewBox="0 0 80 34" aria-hidden="true">
        <polyline points={points} />
      </svg>
  );
}

function MetricCard({ metric, comparisonLabel }) {
  return (
      <article className={`metric-card metric-${metric.tone}`}>
        <div className="metric-main">
        <span className="metric-icon">
          <Icon name={metric.icon} size={28} />
        </span>
          <div className="metric-value">
            <span>{metric.label}</span>
            <strong>{numberFormatter.format(metric.value)}</strong>
          </div>
          <button
              className="plain-button metric-menu"
              type="button"
              aria-label={`More options for ${metric.label}`}
          >
            •••
          </button>
        </div>
        <div className="metric-detail">
        <span className="positive-change">
          ↗ <strong>{metric.changePercent}%</strong>
        </span>
          <span>{comparisonLabel}</span>
          <Sparkline values={metric.sparkline} />
        </div>
      </article>
  );
}

function makeSmoothPath(points) {
  return points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    const previous = points[index - 1];
    const midpoint = (previous.x + point.x) / 2;
    return `${path} C ${midpoint} ${previous.y}, ${midpoint} ${point.y}, ${point.x} ${point.y}`;
  }, "");
}

function getChartScale(points) {
  const maximumValue = Math.max(...points.map((point) => point.value));
  const rawStep = maximumValue / 5;
  const magnitude = 10 ** Math.floor(Math.log10(Math.max(rawStep, 1)));
  const normalizedStep = rawStep / magnitude;
  const multiplier =
      normalizedStep <= 1
          ? 1
          : normalizedStep <= 2
              ? 2
              : normalizedStep <= 2.5
                  ? 2.5
                  : normalizedStep <= 5
                      ? 5
                      : 10;
  const tickStep = Math.max(multiplier * magnitude, 1);
  const maxAxis = Math.max(Math.ceil(maximumValue / tickStep) * tickStep, 5);

  return { maxAxis, tickStep };
}

function ActivityChart({ points }) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  if (!Array.isArray(points) || points.length === 0) {
    return (
        <div style={{ padding: "60px", textAlign: "center", color: "#64748b" }}>
          Loading chart metrics...
        </div>
    );
  }

  const width = 1000;
  const left = 58;
  const right = 20;
  const top = 22;
  const bottom = 43;
  const chartHeight = 250 - bottom;

  const { maxAxis, tickStep } = getChartScale(points);
  const coordinates = points.map((point, index) => ({
    ...point,
    x: left + (index / Math.max(points.length - 1, 1)) * (width - left - right),
    y: top + chartHeight - ((point.value || 0) / maxAxis) * chartHeight,
  }));
  const linePath = makeSmoothPath(coordinates);
  const first = coordinates[0];
  const last = coordinates[coordinates.length - 1];
  const areaPath = `${linePath} L ${last.x} ${top + chartHeight} L ${first.x} ${top + chartHeight} Z`;
  const gridValues = Array.from(
      { length: Math.floor(maxAxis / tickStep) + 1 },
      (_, index) => index * tickStep,
  );

  const handlePointerMove = (event) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const pointerX = ((event.clientX - bounds.left) / bounds.width) * width;
    const nearestPoint = coordinates.reduce((closest, point) =>
        Math.abs(point.x - pointerX) < Math.abs(closest.x - pointerX)
            ? point
            : closest,
    );

    setHoveredPoint((current) =>
        current?.label === nearestPoint.label ? current : nearestPoint,
    );
  };

  return (
      <svg
          className="activity-chart"
          viewBox="0 0 1000 280"
          role="img"
          aria-label="New users over the selected reporting period"
          onMouseMove={handlePointerMove}
          onMouseLeave={() => setHoveredPoint(null)}
      >
        <defs>
          <linearGradient id="chart-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1775f4" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#1775f4" stopOpacity="0.01" />
          </linearGradient>
        </defs>
        {gridValues.map((value) => {
          const y = top + chartHeight - (value / maxAxis) * chartHeight;
          return (
              <g key={value}>
                <line
                    className="chart-grid"
                    x1={left}
                    y1={y}
                    x2={width - right}
                    y2={y}
                />
                <text className="axis-label" x="42" y={y + 4} textAnchor="end">
                  {value}
                </text>
              </g>
          );
        })}
        <path d={areaPath} fill="url(#chart-area)" />
        {hoveredPoint && (
            <line
                className="peak-guide"
                x1={hoveredPoint.x}
                x2={hoveredPoint.x}
                y1={hoveredPoint.y}
                y2={top + chartHeight}
            />
        )}
        <path className="chart-line" d={linePath} />
        {coordinates.map((point) => (
            <g key={point.label}>
              <circle className="chart-dot" cx={point.x} cy={point.y} r="4.5" />
              <text className="axis-label" x={point.x} y="268" textAnchor="middle">
                {point.label}
              </text>
            </g>
        ))}
        {hoveredPoint && (
            <g
                className="chart-tooltip"
                transform={`translate(${Math.min(hoveredPoint.x - 56, 870)} ${Math.max(hoveredPoint.y - 58, 2)})`}
            >
              <rect width="112" height="45" rx="6" />
              <text x="10" y="18">
                {hoveredPoint.label}, 2026
              </text>
              <text className="tooltip-value" x="10" y="35">
                {hoveredPoint.value} new users
              </text>
            </g>
        )}
      </svg>
  );
}

function parseIsoDate(value) {
  if (!value) return new Date();
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toIsoDate(value) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function DateRangeControl({ initialRange }) {
  const [selectedRange, setSelectedRange] = useState(initialRange);
  const [draftRange, setDraftRange] = useState({
    from: parseIsoDate(initialRange?.startDate),
    to: parseIsoDate(initialRange?.endDate),
  });
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const closeOnOutsideClick = (event) => {
      if (!pickerRef.current?.contains(event.target)) setIsOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  const openPicker = () => {
    setDraftRange({
      from: parseIsoDate(selectedRange?.startDate),
      to: parseIsoDate(selectedRange?.endDate),
    });
    setIsOpen((current) => !current);
  };

  const cancelSelection = () => {
    setDraftRange({
      from: parseIsoDate(selectedRange?.startDate),
      to: parseIsoDate(selectedRange?.endDate),
    });
    setIsOpen(false);
  };

  const applySelection = () => {
    if (!draftRange.from || !draftRange.to) return;
    setSelectedRange({
      startDate: toIsoDate(draftRange.from),
      endDate: toIsoDate(draftRange.to),
    });
    setIsOpen(false);
  };

  const rangeLabel = `${dateFormatter.format(parseIsoDate(selectedRange?.startDate))} – ${dateFormatter.format(
      parseIsoDate(selectedRange?.endDate),
  )}`;

  return (
      <div className="date-picker-shell" ref={pickerRef}>
        <button
            className="outlined-control date-control"
            type="button"
            onClick={openPicker}
            aria-expanded={isOpen}
            aria-haspopup="dialog"
            aria-controls="dashboard-date-picker"
        >
          <Icon name="calendar" size={20} />
          <span aria-live="polite">{rangeLabel}</span>
          <span aria-hidden="true">⌄</span>
        </button>
        {isOpen && (
            <div
                className="calendar-popover"
                id="dashboard-date-picker"
                role="dialog"
                aria-label="Select dashboard date range"
            >
              <DayPicker
                  mode="range"
                  selected={draftRange}
                  onSelect={(range) => setDraftRange(range ?? {})}
                  defaultMonth={draftRange.from}
                  min={0}
                  resetOnSelect
                  showOutsideDays
              />
              <div className="calendar-selection-status">
                {draftRange.from && draftRange.to
                    ? `${dateFormatter.format(draftRange.from)} – ${dateFormatter.format(draftRange.to)}`
                    : "Select an end date"}
              </div>
              <div className="calendar-actions">
                <button
                    type="button"
                    className="calendar-cancel"
                    onClick={cancelSelection}
                >
                  Cancel
                </button>
                <button
                    type="button"
                    className="calendar-apply"
                    onClick={applySelection}
                    disabled={!draftRange.from || !draftRange.to}
                >
                  Apply
                </button>
              </div>
            </div>
        )}
      </div>
  );
}

function ChartPeriodControl({ periods, selectedPeriod, onSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef(null);

  const fallbackPeriods = {
    week: { label: "This Week" },
    month: { label: "Last 30 Days" },
    quarter: { label: "Last 90 Days" },
    year: { label: "This Year" },
  };

  const activePeriods = periods && Object.keys(periods).length > 0 ? periods : fallbackPeriods;
  const selectedOption = activePeriods[selectedPeriod] || { label: "This Week" };

  useEffect(() => {
    if (!isOpen) return undefined;

    const closeOnOutsideClick = (event) => {
      if (!pickerRef.current?.contains(event.target)) setIsOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  const selectPeriod = (period) => {
    onSelect(period);
    setIsOpen(false);
  };

  return (
      <div className="period-picker-shell" ref={pickerRef}>
        <button
            className="outlined-control period-control"
            type="button"
            onClick={() => setIsOpen((current) => !current)}
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-controls="chart-period-menu"
        >
          {selectedOption.label}
          <span aria-hidden="true">⌄</span>
        </button>
        {isOpen && (
            <div className="period-menu" id="chart-period-menu" role="listbox">
              {Object.entries(activePeriods).map(([period, option]) => (
                  <button
                      className={`period-menu-option${period === selectedPeriod ? " is-selected" : ""}`}
                      type="button"
                      role="option"
                      aria-selected={period === selectedPeriod}
                      key={period}
                      onClick={() => selectPeriod(period)}
                  >
                    {option.label}
                  </button>
              ))}
            </div>
        )}
      </div>
  );
}

function PortalSearch({ data, navigationItems, onNavigate, onShowCities }) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef(null);
  const normalizedQuery = query.trim().toLowerCase();
  const searchItems = [
    ...(navigationItems || []).map((item) => ({
      id: `page-${item.page}`,
      label: item.label,
      detail: "Page",
      page: item.page,
      searchText: item.label,
    })),
    ...((data?.metrics) || []).map((metric) => ({
      id: `metric-${metric.id}`,
      label: metric.label,
      detail: numberFormatter.format(metric.value),
      page: "overview",
      searchText: `${metric.label} ${metric.value}`,
    })),
    ...((data?.preferredCities) || []).map((city) => ({
      id: `city-${city.id}`,
      label: city.name,
      detail: `${numberFormatter.format(city.users)} users`,
      page: "overview",
      showCities: true,
      searchText: `${city.name} ${city.users}`,
    })),
    ...moderationReports.map((report) => ({
      id: `report-${report.id}`,
      label: report.id,
      detail: report.reportedUser?.name || "Report",
      page: "content-moderation",
      searchText: `${report.id} ${report.contentId} ${report.contentText}`,
    })),
    ...initialKycSubmissions.map((submission) => ({
      id: `kyc-${submission.id}`,
      label: submission.id,
      detail: submission.partnerName,
      page: "kyc-approvals",
      searchText: `${submission.id} ${submission.partnerName} ${submission.email}`,
    })),
  ];
  const results = normalizedQuery
      ? searchItems
          .filter((item) => item.searchText.toLowerCase().includes(normalizedQuery))
          .slice(0, 8)
      : [];

  useEffect(() => {
    if (!isOpen) return undefined;

    const closeOnOutsideClick = (event) => {
      if (!searchRef.current?.contains(event.target)) setIsOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  const selectResult = (result) => {
    onNavigate(result.page);
    if (result.showCities) onShowCities();
    setQuery("");
    setIsOpen(false);
  };

  return (
      <div className="dashboard-search-shell" ref={searchRef}>
        <label className="dashboard-search">
          <Icon name="search" size={19} />
          <input
              type="search"
              name="dashboardSearch"
              placeholder="Search for users, cities, reports..."
              aria-label="Search the admin portal"
              aria-expanded={isOpen && Boolean(normalizedQuery)}
              aria-controls="portal-search-results"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
          />
        </label>
        {isOpen && normalizedQuery && (
            <div
                className="dashboard-search-results"
                id="portal-search-results"
                role="listbox"
            >
              {results.length ? (
                  results.map((result) => (
                      <button
                          type="button"
                          role="option"
                          key={result.id}
                          onClick={() => selectResult(result)}
                      >
                        <strong>{result.label}</strong>
                        <span>{result.detail}</span>
                      </button>
                  ))
              ) : (
                  <p>No matching portal content</p>
              )}
            </div>
        )}
      </div>
  );
}

function AllUsersModal({ users, onClose, onRoleUpdate }) {
  const [userList, setUserList] = useState(users);

  const handleRoleChange = async (userId, newRole) => {
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(`http://localhost:8080/api/users/${userId}/role`, {
        method: "PUT",
        headers: {
          "Authorization": token ? `Bearer ${token}` : "",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (data.success) {
        setUserList((current) =>
            current.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
        );
        if (onRoleUpdate) onRoleUpdate();
      } else {
        alert("Failed to update role: " + (data.error || "Database error"));
      }
    } catch (err) {
      console.error("Role update error:", err);
      alert("Error connecting to backend server.");
    }
  };

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
            aria-labelledby="all-users-title"
            onMouseDown={(event) => event.stopPropagation()}
        >
          <div className="blocked-modal-header">
            <div>
              <span>Security & RBAC Governance</span>
              <h2 id="all-users-title">All Registered Users ({userList.length})</h2>
            </div>
            <button type="button" onClick={onClose} aria-label="Close users list">
              ×
            </button>
          </div>
          {userList.length === 0 ? (
              <div className="moderation-empty-state">
                <strong>No users found</strong>
                <span>Registered database accounts will appear here.</span>
              </div>
          ) : (
              <div className="blocked-users-list">
                {userList.map((user, index) => (
                    <article key={user.id || index} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span className="blocked-user-rank">{String(index + 1).padStart(2, "0")}</span>
                      <span className="avatar avatar-sidebar">{user.email ? user.email.charAt(0).toUpperCase() : "U"}</span>
                      <div className="blocked-user-identity" style={{ flex: 1 }}>
                        <strong>{user.email}</strong>
                        <span style={{ fontSize: "12px", color: "#64748b" }}>KYC: {user.kyc_status || "PENDING"}</span>
                      </div>
                      <div>
                        <label style={{ fontSize: "11px", display: "block", marginBottom: "2px" }}>Assign RBAC Role</label>
                        <select
                            value={user.role || "USER"}
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            style={{ padding: "4px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                        >
                          <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                          <option value="OPERATIONS">OPERATIONS</option>
                          <option value="FINANCE_OPS">FINANCE_OPS</option>
                          <option value="SUPPORT_TEAM">SUPPORT_TEAM</option>
                          <option value="CONTENT_MODERATION">CONTENT_MODERATION</option>
                          <option value="USER">USER</option>
                        </select>
                      </div>
                    </article>
                ))}
              </div>
          )}
        </section>
      </div>
  );
}

function AdminProfileModal({ adminUser, onClose }) {
  const [phone, setPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");

  const email = adminUser?.email || "digitech.pramahar@gmail.com";

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    fetch(`http://localhost:8080/api/admin/profile?email=${email}`, {
      headers: { "Authorization": token ? `Bearer ${token}` : "" }
    })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.admin?.phone_number) {
            setPhone(data.admin.phone_number);
          }
        })
        .catch(err => console.error("Failed to load admin profile:", err));
  }, [email]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback("");

    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch("http://localhost:8080/api/admin/profile", {
        method: "PUT",
        headers: {
          "Authorization": token ? `Bearer ${token}` : "",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, phone, newPassword })
      });
      const data = await res.json();
      if (data.success) {
        setFeedback("Super Admin credentials updated successfully!");
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setFeedback("Error: " + (data.error || "Could not update"));
      }
    } catch (err) {
      setFeedback("Network error updating profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
      <div className="blocked-modal-backdrop" role="presentation" onMouseDown={onClose}>
        <section
            className="blocked-users-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-profile-title"
            onMouseDown={(e) => e.stopPropagation()}
            style={{ maxWidth: "450px" }}
        >
          <div className="blocked-modal-header">
            <div>
              <span>Super Admin Security Settings</span>
              <h2 id="admin-profile-title">Admin Account Controls</h2>
            </div>
            <button type="button" onClick={onClose} aria-label="Close settings">×</button>
          </div>

          <form onSubmit={handleSave} style={{ padding: "20px" }}>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#64748b", marginBottom: "6px" }}>
                Admin Email (Locked)
              </label>
              <input
                  type="email"
                  value={email}
                  disabled
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#f1f5f9", color: "#64748b", fontSize: "14px" }}
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#64748b", marginBottom: "6px" }}>
                Update Mobile Number
              </label>
              <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#64748b", marginBottom: "6px" }}>
                New Password
              </label>
              <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (leave blank to keep current)"
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
              />
            </div>

            {feedback && (
                <div style={{ marginBottom: "16px", fontSize: "13px", fontWeight: "600", color: feedback.includes("Error") ? "#ef4444" : "#16a34a", textAlign: "center" }}>
                  {feedback}
                </div>
            )}

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button type="button" className="calendar-cancel" onClick={onClose} style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#fff", cursor: "pointer" }}>
                Cancel
              </button>
              <button type="submit" className="calendar-apply" style={{ padding: "8px 20px", borderRadius: "8px", background: "#1775f4", color: "#fff", border: "none", cursor: "pointer", fontWeight: "600" }}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </section>
      </div>
  );
}

function Dashboard({ data: initialMockData, adminUser, onLogout }) {
  const [activePage, setActivePage] = useState(() => {
    return localStorage.getItem("admin_active_page") || "overview";
  });

  const [selectedChartPeriod, setSelectedChartPeriod] = useState("week");
  const [showAllCities, setShowAllCities] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [showAllUsersModal, setShowAllUsersModal] = useState(false);
  const [showAdminProfileModal, setShowAdminProfileModal] = useState(false);
  const [chartPoints, setChartPoints] = useState([]);

  const defaultMock = {
    metrics: [
      { id: "active-users", label: "Active Users", value: 1, tone: "blue", icon: "group", changePercent: 8.2, sparkline: [1, 1, 1, 1, 1, 1, 1] },
      { id: "new-users", label: "New Users", value: 1, tone: "green", icon: "userPlus", changePercent: 12.5, sparkline: [0, 0, 0, 1, 1, 1, 1] },
      { id: "total-users", label: "Total Users", value: 1, tone: "purple", icon: "users", changePercent: 5.6, sparkline: [1, 1, 1, 1, 1, 1, 1] },
      { id: "pending-kyc", label: "Pending KYC", value: 0, tone: "amber", icon: "approval", changePercent: 2.1, sparkline: [0, 0, 0, 0, 0, 0, 0] },
    ],
    reportingPeriod: {
      startDate: new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
      comparisonLabel: "vs last week",
    },
    newUsersChart: {
      title: "New Users by Time",
      periods: {
        week: { label: "This Week", points: [] },
        month: { label: "Last 30 Days", points: [] },
        quarter: { label: "Last 90 Days", points: [] },
        year: { label: "This Year", points: [] },
      },
    },
    preferredCities: [
      { id: 1, name: "digitech.pramahar", symbol: "DP", accent: "indigo", users: 1, sharePercent: 100 },
    ],
  };

  const [liveData, setLiveData] = useState(initialMockData || defaultMock);

  const handleNavigate = (page) => {
    setActivePage(page);
    localStorage.setItem("admin_active_page", page);
  };

  const adminEmail = adminUser?.email || "digitech.pramahar@gmail.com";
  const emailPrefix = adminEmail.split("@")[0];
  const adminFullName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1).replace(".", " ");
  const adminInitials = adminFullName.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);

  // 1. Fetch live metrics from /api/dashboard/stats
  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    fetch("http://localhost:8080/api/dashboard/stats", {
      headers: {
        "Authorization": token ? `Bearer ${token}` : "",
        "Content-Type": "application/json"
      }
    })
        .then((res) => res.json())
        .then((data) => {
          if (data && data.success) {
            setLiveData((current) => ({
              ...current,
              ...data,
              metrics: Array.isArray(data.metrics) ? data.metrics : current.metrics,
              reportingPeriod: data.reportingPeriod || current.reportingPeriod,
              newUsersChart: data.newUsersChart || current.newUsersChart,
              preferredCities: Array.isArray(data.preferredCities) && data.preferredCities.length > 0
                  ? data.preferredCities
                  : current.preferredCities,
            }));
          }
        })
        .catch((err) => console.warn("Failed to load /api/dashboard/stats:", err));
  }, []);

  // 2. Fetch live user activity chart data based on selected period
  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    fetch(`http://localhost:8080/api/dashboard/user-activity-chart?period=${selectedChartPeriod}`, {
      headers: {
        "Authorization": token ? `Bearer ${token}` : "",
        "Content-Type": "application/json"
      }
    })
        .then((res) => res.json())
        .then((data) => {
          if (data && data.success && Array.isArray(data.points)) {
            setChartPoints(data.points);
          }
        })
        .catch((err) => console.warn("Could not load live user activity chart:", err));
  }, [selectedChartPeriod]);

  // 3. Fetch registered users from backend for User Accounts & Preferred Cities
  const fetchUsers = () => {
    const token = localStorage.getItem("admin_token");
    fetch("http://localhost:8080/api/users", {
      headers: {
        "Authorization": token ? `Bearer ${token}` : "",
        "Content-Type": "application/json"
      }
    })
        .then((res) => res.json())
        .then((usersList) => {
          if (Array.isArray(usersList)) {
            setAllUsers(usersList);
            const totalCount = usersList.length > 0 ? usersList.length : 1;
            const mappedCities = usersList.slice(0, 5).map((user, index) => {
              const uEmail = user.email || `user${index}@tourbhook.com`;
              const namePart = uEmail.split("@")[0];
              const symbol = namePart.charAt(0).toUpperCase();
              return {
                id: user.id || index,
                name: namePart,
                accent: index % 2 === 0 ? "indigo" : "cyan",
                symbol: symbol,
                users: 1,
                sharePercent: Number((100.0 / totalCount).toFixed(1)),
              };
            });

            setLiveData((current) => ({
              ...current,
              metrics: (current?.metrics || []).map((metric) => {
                if (metric.id === "total-users" || metric.id === "active-users" || metric.label?.includes("Users")) {
                  return { ...metric, value: usersList.length };
                }
                return metric;
              }),
              preferredCities: mappedCities.length > 0 ? mappedCities : current.preferredCities,
            }));
          }
        })
        .catch((err) => {
          console.error("Could not load backend users:", err);
        });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const navigationItems = [
    { label: "User Activity", icon: "group", page: "overview" },
    { label: "Content Moderation", icon: "shield", page: "content-moderation" },
    { label: "KYC Approvals", icon: "approval", page: "kyc-approvals" },
    { label: "System Configuration", icon: "settings", page: "system-configuration" },
  ];

  const preferredCitiesList = liveData?.preferredCities || [];
  const highestShare = preferredCitiesList.length > 0
      ? Math.max(...preferredCitiesList.map((city) => city.sharePercent || 0), 1)
      : 100;

  const fallbackPeriodChart = liveData?.newUsersChart?.periods?.[selectedChartPeriod] || { points: [] };
  const currentChartPoints = chartPoints.length > 0 ? chartPoints : fallbackPeriodChart.points;

  const visibleCities = showAllCities
      ? preferredCitiesList
      : preferredCitiesList.slice(0, 3);

  const handleLogoutClick = () => {
    localStorage.removeItem("admin_active_page");
    onLogout();
  };

  return (
      <div className="dashboard-shell">
        <aside className="sidebar">
          <div className="sidebar-brand">
            <img src="/tourbhook.png" alt="TourBhook" />
            <span>Admin Portal</span>
          </div>
          <nav className="sidebar-navigation" aria-label="Admin portal navigation">
            {navigationItems.map((item) => (
                <button
                    className={`sidebar-link${item.page === activePage ? " is-active" : ""}`}
                    type="button"
                    onClick={item.page ? () => handleNavigate(item.page) : undefined}
                    aria-current={item.page === activePage ? "page" : undefined}
                    key={item.label}
                >
                  <Icon name={item.icon} />
                  <span>{item.label}</span>
                </button>
            ))}
          </nav>
          <div className="sidebar-lower">
            <div
                className="sidebar-user"
                onClick={() => setShowAdminProfileModal(true)}
                style={{ cursor: "pointer" }}
                title="Manage Super Admin credentials"
            >
              <span className="avatar avatar-sidebar">{adminInitials}</span>
              <div>
                <strong>{adminFullName}</strong>
                <span>{adminUser?.role || "SUPER_ADMIN"}</span>
              </div>
              <span className="chevron">›</span>
            </div>
            <button className="sidebar-link" type="button" onClick={handleLogoutClick}>
              <Icon name="logout" />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        <div className="dashboard-workspace">
          <header className="topbar">
            <PortalSearch
                data={liveData}
                navigationItems={navigationItems}
                onNavigate={handleNavigate}
                onShowCities={() => setShowAllCities(true)}
            />
            <div className="topbar-profile">
              <span className="avatar">{adminInitials}</span>
            </div>
          </header>

          {activePage === "content-moderation" ? (
              <ContentModeration />
          ) : activePage === "kyc-approvals" ? (
              <KycApprovals />
          ) : activePage === "system-configuration" ? (
              <SystemConfiguration />
          ) : (
              <main className="dashboard-content">
                <section className="dashboard-heading">
                  <div>
                    <h1>User Activity</h1>
                    <p>
                      Welcome back, {adminFullName.split(" ")[0]}! Here&apos;s what&apos;s happening on
                      TourBhook today.
                    </p>
                  </div>
                  {liveData?.reportingPeriod && <DateRangeControl initialRange={liveData.reportingPeriod} />}
                </section>

                <section className="metrics-grid" aria-label="Activity summary">
                  {(liveData?.metrics || []).map((metric) => (
                      <MetricCard
                          metric={metric}
                          comparisonLabel={liveData?.reportingPeriod?.comparisonLabel || "vs last week"}
                          key={metric.id}
                      />
                  ))}
                </section>

                <section className="dashboard-panel chart-panel">
                  <div className="panel-heading">
                    <h2>{liveData?.newUsersChart?.title || "New Users by Time"}</h2>
                    <ChartPeriodControl
                        periods={liveData?.newUsersChart?.periods}
                        selectedPeriod={selectedChartPeriod}
                        onSelect={setSelectedChartPeriod}
                    />
                  </div>
                  <div className="chart-scroll">
                    <ActivityChart points={currentChartPoints} />
                  </div>
                </section>

                <section className="dashboard-panel city-panel">
                  <div className="panel-heading">
                    <h2>Most Preferred Cities</h2>
                    <div className="panel-heading-actions">
                      <button
                          className="plain-button view-all"
                          type="button"
                          aria-expanded={showAllCities}
                          onClick={() => setShowAllCities((current) => !current)}
                      >
                        {showAllCities ? "Show less" : "View all"}
                      </button>
                      <button
                          className="plain-button view-all"
                          type="button"
                          onClick={() => {
                            fetchUsers();
                            setShowAllUsersModal(true);
                          }}
                      >
                        User Accounts
                      </button>
                    </div>
                  </div>
                  <div className="city-table-scroll">
                    <table className="city-table">
                      <thead>
                      <tr>
                        <th scope="col">#</th>
                        <th scope="col">City</th>
                        <th scope="col">
                          <span className="visually-hidden">Relative popularity</span>
                        </th>
                        <th scope="col">Users</th>
                        <th scope="col">Share</th>
                      </tr>
                      </thead>
                      <tbody>
                      {visibleCities.map((city, index) => (
                          <tr key={city.id}>
                            <td>{String(index + 1).padStart(2, "0")}</td>
                            <td>
                        <span className={`city-marker city-${city.accent || "indigo"}`}>
                          {city.symbol}
                        </span>
                              <strong>{city.name}</strong>
                            </td>
                            <td>
                        <span className="city-progress">
                          <span
                              className={`city-progress-value city-${city.accent || "indigo"}`}
                              style={{
                                width: `${(city.sharePercent / highestShare) * 84}%`,
                              }}
                          />
                        </span>
                            </td>
                            <td>{numberFormatter.format(city.users)}</td>
                            <td>{city.sharePercent.toFixed(1)}%</td>
                          </tr>
                      ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </main>
          )}
        </div>

        {showAllUsersModal && (
            <AllUsersModal users={allUsers} onClose={() => setShowAllUsersModal(false)} onRoleUpdate={fetchUsers} />
        )}

        {showAdminProfileModal && (
            <AdminProfileModal adminUser={adminUser} onClose={() => setShowAdminProfileModal(false)} />
        )}
      </div>
  );
}

export default Dashboard;