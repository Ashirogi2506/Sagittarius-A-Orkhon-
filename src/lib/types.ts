export type Verification = "verified-note" | "demo" | "unverified" | "live";

export type AnnouncementCategory =
  | "water" | "electricity" | "road" | "traffic" | "transport" | "waste" | "environment" | "service" | "emergency";

export interface Location {
  province: string;      // аймаг
  sum: string;           // сум
  bag?: string;          // баг
  area?: string;         // хороолол / микро
}

export interface Announcement {
  id: string;
  organization: string;
  title: string;
  category: AnnouncementCategory;
  location: Location;
  locationNote?: string;     // e.g. "Байршил баталгаажаагүй"
  start?: string;            // ISO; undefined = unknown, never guessed
  end?: string;
  description: string;
  summary: string;
  sourceUrl: string;
  sourceName: string;
  publishedAt: string;       // ISO date
  checkedAt: string;         // ISO date-time when someone checked it
  verification: Verification;
}

export type IssueStatus = "new" | "progress" | "resolved";
export type IssueCategory =
  | "road" | "air" | "waste" | "transport" | "lighting" | "water" | "education" | "health";

export interface Issue {
  id: string;
  title: string;
  category: IssueCategory;
  status: IssueStatus;
  lat: number;
  lng: number;
  coordsDemo: boolean;       // true = illustrative coordinates
  area: string;
  description: string;
  reportedAt: string;
  demo: boolean;
  organization?: string;
  action?: string;
  resolvedAt?: string;
}

export interface Report {
  tracking: string;
  title: string;
  category: IssueCategory;
  area: string;
  lat?: number;
  lng?: number;
  description: string;
  photo?: string;            // compressed data URL kept only in this browser
  createdAt: string;
  status: IssueStatus;
  history: { at: string; status: IssueStatus; note: string }[];
}

export interface Solution {
  id: string;
  issueTitle: string;
  idea: string;
  author: string;
  votes: number;
  progress: "idea" | "review" | "planned" | "done";
  comments: { who: string; text: string; at: string }[];
  demo: boolean;
}

export interface ChatMessage { role: "user" | "assistant"; text: string; mode?: "gemini" | "demo" | "live" | "error"; warning?: string }
