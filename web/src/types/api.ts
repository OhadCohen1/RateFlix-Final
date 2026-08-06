import type { User, Profile, ProfileStats, MyRating, AdminStats } from './index';

/** מעטפת תשובה אחידה מהשרת */
export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  error?: string | object;
  timestamp: string;
}

/** מסמך סרט כמו שחוזר מהבקאנד */
export interface ApiMovie {
  _id: string;
  title: string;
  description?: string;
  categoryId?: string;
  categoryName?: string;
  imageUrl?: string;
  year?: number;
  tags?: string[];
  createdAt: string;
  /** מחושב באגרגציה של הקטלוג */
  avgRating?: number;
  ratingCount?: number;
  /** מופיע רק בתשובת המלצות */
  predictedScore?: number;
}

export interface ApiRating {
  _id: string;
  userId: string;
  itemId: string;
  score: number;
  reviewText?: string;
  updatedAt: string;
}

export interface ApiCategory {
  _id: string;
  name: string;
  slug: string;
  displayOrder: number;
}

/* ------------------------- response payloads (data) ------------------------ */

export interface AuthPayload {
  token: string;
  user: User;
}

export interface MoviesPayload {
  count: number;
  movies: ApiMovie[];
}

export interface MoviePayload {
  movie: ApiMovie;
}

export interface RatingPayload {
  rating: ApiRating;
}

export interface RecommendationsPayload {
  source: 'knn' | 'popular';
  count: number;
  movies: ApiMovie[];
}

export interface CategoriesPayload {
  count: number;
  categories: ApiCategory[];
}

export interface MyScoresPayload {
  scores: Record<string, number>;
}

export interface ApiMyRating {
  _id: string;
  score: number;
  reviewText?: string;
  updatedAt: string;
  movie: { _id: string; title: string; imageUrl?: string };
}

export interface ProfilePayload {
  user: User & { id: string };
  profile: (Profile & { _id: string }) | null;
  stats: ProfileStats;
  ratings: ApiMyRating[];
}

export interface AdminStatsPayload extends Omit<AdminStats, 'recentLogs'> {
  recentLogs: {
    _id: string;
    userEmail: string;
    source: 'knn' | 'popular';
    itemsCount: number;
    executionTimeMs: number;
    calculatedAt: string;
  }[];
}

export type { MyRating };
