# TourBhook Admin Portal

A responsive, frontend-only admin portal for TourBhook. The project provides a local login experience and interactive admin workflows for user activity, content moderation, KYC approvals, and system configuration. All operational data is isolated as realistic mock data so it can be replaced by a backend service later.

## Highlights

- Accessible local login and logout flow
- Responsive dashboard with KPI cards, date-range selection, period selection, and an interactive new-user chart
- Content Moderation workspace with filters, report review, local moderation actions, and pagination
- KYC Approvals workspace with searchable submissions, document previews, status management, and local review actions
- System Configuration workspace with validated numeric settings, feature flags, confirmation modal, and local audit history
- Fixed desktop sidebar and responsive mobile layout

## Tech Stack

- React 19
- Vite 8
- React Day Picker 10
- Plain CSS
- ESLint

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm

### Install dependencies

```bash
npm install
```

### Start the development server

```bash
npm run dev
```

Open the local URL printed by Vite.

### Build for production

```bash
npm run build
```

### Run linting

```bash
npm run lint
```

### Preview the production build

```bash
npm run preview
```

## Portal Areas

### User Activity

- User and trip KPI cards with trend indicators
- Date-range picker with Apply and Cancel actions
- Reporting-period selector for weekly, 30-day, and 90-day chart data
- Responsive SVG chart with nearest-point hover tooltip
- Most Preferred Cities table

### Content Moderation

- Search by report ID, reported user, username, or reported content
- Status, severity, and date filters, including a custom date range
- Newest/oldest sorting and pagination
- Report detail drawer with reported content, user context, history, and moderator notes
- Local actions to dismiss reports, remove content, block users, and unblock users
- Blocked-user summary and transient feedback states

### KYC Approvals

- Searchable KYC submissions and status filtering
- Summary cards for review states
- Document-completeness filtering
- Submission details with local document preview assets
- Local approval, rejection, and review-status actions

### System Configuration

- Grouped Algorithm & Weights, AI Thresholds, and Feature Flags settings
- Range validation for numeric configuration values
- Save Change confirmation with an optional change reason
- Local feature-flag toggles
- Change History tab showing old and new values, administrator, timestamp, and reason

## Project Structure

```text
src/
├── data/
│   ├── dashboardMockData.js                 # Dashboard presentation data
│   ├── dashboardMockData.d.ts               # Dashboard data contract reference
│   ├── moderationMockData.js                # Moderation reports, filters, and KPIs
│   ├── moderationMockData.d.ts              # Moderation data contract reference
│   ├── systemConfigurationMockData.js       # Configuration settings and audit records
│   ├── systemConfigurationMockData.d.ts     # Configuration data contract reference
│   └── kyc/
│       ├── kycData.js                       # KYC submissions and filter data
│       └── kycDocuments.js                  # KYC document definitions
├── hooks/
│   ├── useModeration.js                     # Local moderation state transitions
│   └── useSystemConfiguration.js            # Local configuration state and audit history
├── Pages/
│   ├── Login.jsx / Login.css
│   ├── Dashboard.jsx / Dashboard.css
│   ├── ContentModeration.jsx / ContentModeration.css
│   ├── KycApprovals.jsx / KycApprovals.css
│   └── SystemConfiguration.jsx / SystemConfiguration.css
├── App.jsx                                  # Local view transition and portal entry point
└── main.jsx

public/
├── bg.png                                   # Sidebar illustration
├── tourbhook.png                            # Brand asset
└── mock-documents/                          # Local KYC preview and PDF assets
```

## Mock Data and Backend Handoff

The portal intentionally has no API calls, database, browser storage, or real authentication. It is designed so a backend team can replace mock data without rebuilding the UI.

- Dashboard display data is in `src/data/dashboardMockData.js`.
- Moderation data and its shape reference are in `src/data/moderationMockData.js` and `src/data/moderationMockData.d.ts`.
- KYC data and document definitions are in `src/data/kyc/`.
- System Configuration data and its shape reference are in `src/data/systemConfigurationMockData.js` and `src/data/systemConfigurationMockData.d.ts`.
- Local state transitions are kept in `src/hooks/`, leaving page components focused on rendering and interaction.

For an API integration, replace each mock-data source and the corresponding local state actions with service calls while retaining the existing page-level data contracts.

## Notes

- Login, moderation, KYC, and configuration changes are local-only and reset when the page reloads.
- The dashboard’s date range and reporting period are frontend controls. They are ready to provide request values to a future analytics service.
- No credentials, user changes, moderation decisions, or settings changes are persisted.
