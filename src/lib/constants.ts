export const SCHOOL_NAME = "Stafford International School";
export const APP_NAME = "Stafford Maintenance";
export const TIME_ZONE = "Asia/Colombo";

export const ROLES = ["admin", "supervisor", "staff", "pending"] as const;
export type Role = (typeof ROLES)[number];
export const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  supervisor: "Supervisor",
  staff: "Technician / Staff",
  pending: "Pending approval",
};

export const WORK_TYPES = ["electrical", "hvac", "plumbing", "cctv", "fire", "other"] as const;
export type WorkType = (typeof WORK_TYPES)[number];
export const WORK_TYPE_LABELS: Record<WorkType, string> = {
  electrical: "Electrical",
  hvac: "HVAC",
  plumbing: "Plumbing",
  cctv: "CCTV",
  fire: "Fire",
  other: "Other",
};

export const BUILDINGS = ["al_building", "main_building", "primary_building", "eyfs_site", "other"] as const;
export type Building = (typeof BUILDINGS)[number];
export const BUILDING_LABELS: Record<Building, string> = {
  al_building: "AL Building",
  main_building: "Main Building",
  primary_building: "Primary Building",
  eyfs_site: "EYFS Site",
  other: "Other / Grounds",
};

export const PRIORITIES = ["low", "normal", "high", "urgent"] as const;
export type Priority = (typeof PRIORITIES)[number];
export const PRIORITY_LABELS: Record<Priority, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent",
};

export const STATUSES = ["open", "assigned", "in_progress", "completed", "closed"] as const;
export type Status = (typeof STATUSES)[number];
export const STATUS_LABELS: Record<Status, string> = {
  open: "Unassigned",
  assigned: "Assigned",
  in_progress: "In progress",
  completed: "Awaiting closure",
  closed: "Closed",
};

export const FREQUENCIES = ["weekly", "monthly", "quarterly", "half_yearly", "yearly"] as const;
export type Frequency = (typeof FREQUENCIES)[number];
export const FREQUENCY_LABELS: Record<Frequency, string> = {
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Every 3 months",
  half_yearly: "Every 6 months",
  yearly: "Yearly",
};

export const MAX_PHOTOS = 4;
