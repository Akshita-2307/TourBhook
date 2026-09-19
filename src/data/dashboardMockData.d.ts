export type MetricTone = "blue" | "green" | "purple" | "orange";
export type CityAccent = "coral" | "blue" | "green" | "purple" | "orange";

export interface DashboardUser {
  firstName: string;
  fullName: string;
  role: string;
  initials: string;
}

export interface DashboardMetric {
  id: string;
  label: string;
  value: number;
  changePercent: number;
  tone: MetricTone;
  icon: "users" | "userPlus" | "group" | "location";
  sparkline: number[];
}

export interface ChartPoint {
  label: string;
  value: number;
}

export type ChartPeriod = "week" | "30days" | "90days";

export interface ChartPeriodData {
  label: string;
  points: ChartPoint[];
}

export interface PreferredCity {
  id: string;
  name: string;
  users: number;
  sharePercent: number;
  accent: CityAccent;
  symbol: string;
}

export interface DashboardData {
  user: DashboardUser;
  reportingPeriod: {
    startDate: string;
    endDate: string;
    comparisonLabel: string;
  };
  metrics: DashboardMetric[];
  newUsersChart: {
    title: string;
    periods: Record<ChartPeriod, ChartPeriodData>;
  };
  preferredCities: PreferredCity[];
}

export const dashboardMockData: DashboardData;
