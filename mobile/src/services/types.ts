import type { User, UserRole, Profile, ProfileStats } from '../types';

/**
 * Standard API envelope (matches the course response.builder):
 * { success, data, timestamp } on success / { success, error, timestamp } on failure
 */
export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  error?: string | object;
  timestamp: string;
}

/** Backend response payloads (documents exactly as the API returns them) */

export interface ApiMovie {
  _id: string;
  title: string;
  description?: string;
  categoryId?: string;
  categoryName?: string;
  imageUrl?: string;
  tags?: string[];
  createdAt: string;
  avgRating?: number;
  ratingCount?: number;
  predictedScore?: number;
}

export interface AuthPayload {
  token: string;
  user: User;
}

export interface MoviesPayload {
  count: number;
  movies: ApiMovie[];
}

export interface RecommendationsPayload extends MoviesPayload {
  source: 'knn' | 'popular';
}

export interface CategoriesPayload {
  categories: { _id: string; name: string }[];
}

export interface MyScoresPayload {
  scores: Record<string, number>;
}

export interface ApiMyRating {
  _id: string;
  score: number;
  updatedAt: string;
  movie: { _id: string; title: string; imageUrl?: string };
}

export interface ProfilePayload {
  user: User;
  profile: Profile | null;
  stats: ProfileStats;
  ratings: ApiMyRating[];
}

export interface UsersPayload {
  count: number;
  users: {
    _id: string;
    email: string;
    role: UserRole;
    name: string | null;
    ratingsCount: number;
    topCategories: string[];
  }[];
}
