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
  floor?: string;       // e.g. "4F"
  floorKey?: string;    // SVG フロアプラン識別子（例: "toranomon-4f"）
  imagePath?: string;   // 背景画像フォールバック（/public 配下）
  /** SVG viewBox の幅（座標系の単位幅） */
  width: number;
  /** SVG viewBox の高さ */
  height: number;
  // 旧フィールド（互換のため残す）
  imageWidth?: number;
  imageHeight?: number;
  updatedAt?: string;
}

export type DeskType = "desk" | "label";
export type DeskOrient = "up" | "down" | "left" | "right";

export interface Desk {
  id: string;
  /** SVG viewBox 座標（絶対ピクセル） */
  x: number;
  y: number;
  /** デスクの幅・高さ（省略時はデフォルト） */
  w?: number;
  h?: number;
  label: string;
  type: DeskType;
  /** 椅子の向き（背後に椅子を描画） */
  orient?: DeskOrient;
  /** 同じ島（ポッド）に属するデスクのグルーピングキー */
  pod?: string;
}

export type RoomType = "meeting" | "phone" | "service";

export interface Room {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  name: string;
  subname?: string;
  capacity?: number;
  type: RoomType;
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
