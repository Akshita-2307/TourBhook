export type ModerationStatus = "Resolved" | "Review" | "Blocked" | "Pending";
export type ModerationSeverity = "High" | "Medium" | "Low" | "Severe";

export interface ModerationUser {
  id: string;
  name: string;
  username: string;
  initials: string;
  accountStatus: string;
  previousReports: number;
}

export interface ModerationReporter {
  id: string;
  name: string;
  username: string;
  initials: string;
  previousReports: number;
}

export interface ModerationHistoryEvent {
  action: string;
  createdAt: string;
  moderator: string;
}

export interface ModerationReport {
  id: string;
  contentId: string;
  contentText: string;
  contentImage: string;
  contentRemoved: boolean;
  reportedUser: ModerationUser;
  reporter: ModerationReporter;
  severity: ModerationSeverity;
  status: ModerationStatus;
  submittedAt: string;
  reportCount: number;
  moderatorNotes: string;
  moderationHistory: ModerationHistoryEvent[];
}

export interface BlockedUser extends ModerationUser {
  reason: string;
  blockedAt: string;
  blockedBy: string;
  status: "Permanently Blocked";
}

export interface ModerationFilters {
  search: string;
  status: "All" | ModerationStatus;
  severity: "All" | ModerationSeverity;
  datePreset: "today" | "7days" | "30days" | "custom";
  startDate: string | null;
  endDate: string | null;
}

export const moderationReferenceTime: string;
export const moderationSummary: {
  openReports: number;
  openReportsChange: number;
  criticalReports: number;
  criticalReportsToday: number;
  resolvedToday: number;
};
export const moderationReports: ModerationReport[];
export const moderationBlockedUsers: BlockedUser[];
export const defaultModerationFilters: ModerationFilters;
