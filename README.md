# TourBhook Admin Portal

A responsive React admin portal prototype for TourBhook. It includes a local login flow, an activity dashboard, and a stateful Content Moderation workspace built with isolated mock data for an easy future backend handoff.

## Features

### Login

- Native, accessible email and password form fields
- Local-only login transition to the admin portal
- Local logout back to the login screen

### Dashboard Overview

- KPI cards for users and trips
- Responsive new-user activity chart with hover tooltips
- Interactive dashboard date-range picker with Apply and Cancel actions
- Timeline selector for weekly, 30-day, and 90-day chart datasets
- Preferred-cities table
- Fixed desktop sidebar and sticky top bar

### Content Moderation

- Runtime navigation between Overview and Content Moderation
- Moderation KPI cards, including a live blocked-user count
- Search by report ID, reported user, username, or content text
- Working status, severity, and date-range filters
- Quick date options for Today, Last 7 Days, and Last 30 Days, plus a custom date range
- Clear Filters action, newest/oldest sorting, and pagination
- Serial report numbering with no checkbox column
- Report review drawer with reported content, reporter, user context, notes, and moderation history
- Local moderation actions: dismiss a report, remove content, permanently block a user, and unblock a user
- Blocked-users modal and temporary success feedback
- Loading, empty, and error-state UI scaffolding

## Tech Stack

- React 19
- Vite 8
- React Day Picker 10
- ESLint
- Plain CSS

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

Open the local URL shown by Vite in your browser.

### Build for production

```bash
npm run build
```

### Run linting

```bash
npm run lint
```

### Preview a production build

```bash
npm run preview
```

## Project Structure

```text
src/
├── data/
│   ├── dashboardMockData.js       # Overview presentation data
│   ├── dashboardMockData.d.ts     # Dashboard data contract reference
│   ├── moderationMockData.js      # Moderation reports, users, filters, and KPIs
│   └── moderationMockData.d.ts    # Moderation data contract reference
├── hooks/
│   └── useModeration.js           # Local moderation state and state transitions
├── Pages/
│   ├── Login.jsx
│   ├── Login.css
│   ├── Dashboard.jsx
│   ├── Dashboard.css
│   ├── ContentModeration.jsx
│   └── ContentModeration.css
├── App.jsx                         # Local view transition and portal entry point
└── main.jsx
```

## Mock Data and Backend Handoff

This project is frontend-only. It does not make network requests, persist session data, or implement authentication.

Presentation data is kept outside page components:

- `src/data/dashboardMockData.js` provides dashboard user, metric, chart, and city data.
- `src/data/moderationMockData.js` provides reports, blocked users, moderation KPIs, and default filter values.
- The adjacent `.d.ts` files describe the expected shape of each data set for future TypeScript or API integration.

The Content Moderation page keeps local UI state in `src/hooks/useModeration.js`. To connect a backend later, replace the initial mock collections and the local action functions with service calls while preserving the page components and their data contracts.

## Moderation Data Model

Each moderation report includes:

- A stable report ID and content ID
- Reported content text and local image reference
- Reported-user and reporter details
- Severity and status values
- A machine-readable `submittedAt` timestamp
- Report count, moderator notes, content-removal state, and moderation history

Supported statuses are `Resolved`, `Review`, `Blocked`, and `Pending`. Supported severity values are `High`, `Medium`, `Low`, and `Severe`.

## Notes

- All login and moderation changes are intentionally local and reset when the page reloads.
- Sidebar placeholders such as KYC Approvals, User Activity, and System Configuration are visual-only until their pages are implemented.
- The dashboard date control and chart timeline are independent frontend controls; neither currently changes backend data.
