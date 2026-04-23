export interface UserProfile {
  // 必須項目
  department?: string;        // 部署名
  jobDescription?: string;    // 仕事内容
  relatedMembers?: string;    // 関わりが深いメンバー
  // 自由記入項目
  joinDate?: string;          // 入社年月日
  careerHistory?: string;     // 職歴
  birthday?: string;          // 誕生日
  hometown?: string;          // 出身地
  currentArea?: string;       // 出没エリア
  personality?: string;       // 性格（長所・短所）
  languages?: string;         // 言語
  specialSkills?: string;     // 特技
  hobbies?: string;           // 趣味
  favoriteFood?: string;      // 好きな食べ物
  dislikedFood?: string;      // 苦手な食べ物
  recentInterests?: string;   // 最近はやっているもの
  weekends?: string;          // 週末の過ごし方
  freeText?: string;          // その他
}

export interface User extends UserProfile {
  uid: string;
  name: string;
  email: string;
  photo: string;
  isAdmin: boolean;
  isActive?: boolean;
  chatworkAccountId?: string;
  confluencePageUrl?: string;
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
  topics?: string[]; // AI生成の話題・共通点
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

export interface SeatingLayout {
  cols: number;      // 列数
  rows: number;      // 行数
  updatedAt?: string;
}

export type DeskType = "desk" | "label";

export interface Desk {
  id: string;
  row: number;       // 0-indexed
  col: number;       // 0-indexed
  label: string;     // e.g. "A-1" or "会議室"
  type: DeskType;    // "desk" は予約可、"label" は表示のみ
}

export type SeatStatus = "reserved" | "in_use";

export interface SeatingRecord {
  uid: string;       // email
  name: string;
  photo?: string;
  department?: string;
  deskId: string;
  status: SeatStatus;
  reservedAt?: string;
  checkedInAt?: string;
  updatedAt: string;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  emoji: string;
  category: string; // 趣味・スポーツ・仕事・その他
  memberCount: number;
  createdAt: string;
  createdBy: string;
}

export interface CommunityPost {
  id: string;
  content: string;
  authorUid: string;
  authorName: string;
  authorPhoto?: string;
  createdAt: string;
  likeCount: number;
  likedBy?: string[]; // emailリスト
}
