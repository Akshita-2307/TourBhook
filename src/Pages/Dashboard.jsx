import { useEffect, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import ContentModeration from "./ContentModeration";
import KycApprovals from "./KycApprovals";
import SystemConfiguration from "./SystemConfiguration";
import "./Dashboard.css";

const numberFormatter = new Intl.NumberFormat("en-US");
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function Icon({ name, size = 22 }) {
  const icons = {
    menu: <path d="M3 6h18M3 12h18M3 18h18" />,
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
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const range = Math.max(maximum - minimum, 1);
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * 78 + 1;
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

function ActivityChart({ points }) {
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const width = 1000;
  const left = 58;
  const right = 20;
  const top = 22;
  const bottom = 43;
  const chartHeight = 250 - bottom;
  const maxAxis = Math.max(
    300,
    Math.ceil(Math.max(...points.map((point) => point.value)) / 50) * 50,
  );
  const coordinates = points.map((point, index) => ({
    ...point,
    x: left + (index / Math.max(points.length - 1, 1)) * (width - left - right),
    y: top + chartHeight - (point.value / maxAxis) * chartHeight,
  }));
  const linePath = makeSmoothPath(coordinates);
  const first = coordinates[0];
  const last = coordinates[coordinates.length - 1];
  const areaPath = `${linePath} L ${last.x} ${top + chartHeight} L ${first.x} ${top + chartHeight} Z`;
  const gridValues = Array.from(
    { length: maxAxis / 50 + 1 },
    (_, index) => index * 50,
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
            {hoveredPoint.label}, 2024
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
    from: parseIsoDate(initialRange.startDate),
    to: parseIsoDate(initialRange.endDate),
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
      from: parseIsoDate(selectedRange.startDate),
      to: parseIsoDate(selectedRange.endDate),
    });
    setIsOpen((current) => !current);
  };

  const cancelSelection = () => {
    setDraftRange({
      from: parseIsoDate(selectedRange.startDate),
      to: parseIsoDate(selectedRange.endDate),
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

  const rangeLabel = `${dateFormatter.format(parseIsoDate(selectedRange.startDate))} – ${dateFormatter.format(
    parseIsoDate(selectedRange.endDate),
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
  const selectedOption = periods[selectedPeriod];

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
          {Object.entries(periods).map(([period, option]) => (
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

function Dashboard({ data, onLogout }) {
  const [activePage, setActivePage] = useState("overview");
  const [selectedChartPeriod, setSelectedChartPeriod] = useState("week");
  const navigationItems = [
    { label: "User Activity", icon: "group", page: "overview" },
    { label: "Content Moderation", icon: "shield", page: "content-moderation" },
    { label: "KYC Approvals", icon: "approval", page: "kyc-approvals" },
    { label: "System Configuration", icon: "settings", page: "system-configuration" },
  ];
  const highestShare = Math.max(
    ...data.preferredCities.map((city) => city.sharePercent),
  );
  const selectedChart = data.newUsersChart.periods[selectedChartPeriod];

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
              onClick={item.page ? () => setActivePage(item.page) : undefined}
              aria-current={item.page === activePage ? "page" : undefined}
              key={item.label}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-lower">
          <div className="sidebar-user">
            <span className="avatar avatar-sidebar">{data.user.initials}</span>
            <div>
              <strong>{data.user.fullName}</strong>
              <span>{data.user.role}</span>
            </div>
            <span className="chevron">›</span>
          </div>
          <button className="sidebar-link" type="button" onClick={onLogout}>
            <Icon name="logout" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="dashboard-workspace">
        <header className="topbar">
          <button
            className="plain-button menu-button"
            type="button"
            aria-label="Open navigation"
          >
            <Icon name="menu" size={27} />
          </button>
          <label className="dashboard-search">
            <Icon name="search" size={19} />
            <input
              type="search"
              name="dashboardSearch"
              placeholder="Search for users, cities, reports..."
              aria-label="Search the admin portal"
            />
          </label>
          <div className="topbar-profile">
            <span className="avatar">{data.user.initials}</span>
            <button
              className="plain-button"
              type="button"
              aria-label="Open profile menu"
            >
              ⌄
            </button>
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
                Welcome back, {data.user.firstName}! Here&apos;s what&apos;s happening on
                TourBhook today.
              </p>
            </div>
            <DateRangeControl initialRange={data.reportingPeriod} />
          </section>

          <section className="metrics-grid" aria-label="Activity summary">
            {data.metrics.map((metric) => (
              <MetricCard
                metric={metric}
                comparisonLabel={data.reportingPeriod.comparisonLabel}
                key={metric.id}
              />
            ))}
          </section>

          <section className="dashboard-panel chart-panel">
            <div className="panel-heading">
              <h2>{data.newUsersChart.title}</h2>
              <ChartPeriodControl
                periods={data.newUsersChart.periods}
                selectedPeriod={selectedChartPeriod}
                onSelect={setSelectedChartPeriod}
              />
            </div>
            <div className="chart-scroll">
              <ActivityChart points={selectedChart.points} />
            </div>
          </section>

          <section className="dashboard-panel city-panel">
            <div className="panel-heading">
              <h2>Most Preferred Cities</h2>
              <button className="plain-button view-all" type="button">
                View all
              </button>
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
                  {data.preferredCities.map((city, index) => (
                    <tr key={city.id}>
                      <td>{String(index + 1).padStart(2, "0")}</td>
                      <td>
                        <span className={`city-marker city-${city.accent}`}>
                          {city.symbol}
                        </span>
                        <strong>{city.name}</strong>
                      </td>
                      <td>
                        <span className="city-progress">
                          <span
                            className={`city-progress-value city-${city.accent}`}
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
    </div>
  );
}

export default Dashboard;
