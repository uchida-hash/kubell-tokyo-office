export interface User {
  uid: string;
  name: string;
  email: string;
  photo: string;
  department?: string;
  isAdmin: boolean;
  chatworkAccountId?: string;
  miiveLinked?: boolean;
}

export interface AttendanceRecord {
  uid: string;
  name: string;
  email: string;
  photo: string;
  department?: string;
  registeredAt: string; // ISO string
  chatworkAccountId?: string;
  confluencePageUrl?: string;
}

export interface LunchParticipant {
  uid: string;
  name: string;
  email: string;
  photo: string;
  department?: string;
  registeredAt: string;
}

export interface LunchMatch {
  id: string;
  date: string; // YYYY-MM-DD
  groups: LunchGroup[];
  createdAt: string;
}

export interface LunchGroup {
  members: LunchParticipant[];
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  authorName: string;
  authorEmail: string;
  priority: "normal" | "important" | "urgent";
  publishedAt: string;
  expiresAt?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  description?: string;
  location?: string;
  htmlLink?: string;
}

export interface MiiveBalance {
  point: number;
  expirePoint: number;
  expireDate?: string;
}
