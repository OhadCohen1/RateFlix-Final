import type { User, UserRole, Profile, ProfileStats } from '../types';

/** מעטפת תשובה אחידה מהשרת */
export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  error?: string | object;
  timestamp: string;
}

/** טיפוסים לתשובות כמו שה-API מחזיר */

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
