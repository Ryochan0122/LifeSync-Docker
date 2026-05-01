import { User } from 'firebase/auth';

export interface Schedule {
  id: string;
  date: string;
  title: string;
  time: string;
  priority: '高' | '中' | '低';
  reminders: number[];
  isPublic?: boolean;
  isPrivate?: boolean;
  userId?: string;
}

export type PostType = 'checkin' | 'streak' | 'missed' | 'challenge';

export interface Post {
  id: string;
  userId: string;
  userDisplayName: string;
  userAvatarColor: string;
  userStreak: number;
  type: PostType;
  content: string;
  scheduleTitle?: string;
  privacy: 'public' | 'friends' | 'private';
  likes: string[];
  commentCount: number;
  createdAt: any;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  handle: string;
  avatarColor: string;
  streak: number;
  score: number;
  status: 'active' | 'idle' | 'offline';
  currentActivity?: any;
  hasPostedToday: boolean;
  followingIds: string[];
  followerIds: string[];
  comboCount?: number;
  comboLastDate?: string;
  lastPostDate?: string;
}

export type RootStackParamList = {
  Home: undefined;
  Auth: undefined;
  Main: undefined;
  Calendar: undefined;
  AddSchedule: { defaultDate?: string; onAdd?: (schedule: Omit<Schedule, 'id'>) => void } | undefined;
  EditSchedule: { schedule: Schedule };
  History: undefined;
  Question: undefined;
  Feed: undefined;
  NewPost: undefined;
  CommunityFeed: undefined;
  FriendSearch: undefined;
  Settings: undefined;
};

export type MainTabParamList = {
  FeedTab: undefined;
  CalendarTab: undefined;
  CommTab: undefined;
  SettingsTab: undefined;
};