export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  isActive?: boolean;
  createdAt?: string;
}

/** A catalog item (movie) as the UI consumes it */
export interface Item {
  id: string;
  name: string;
  description: string;
  categoryId?: string;
  categoryName?: string;
  imageUrl?: string;
  year?: number;
  avgRating: number;
  ratingCount: number;
  createdBy?: string;
  createdAt: string;
  tags: string[];
  /** Present only on items returned by the recommendations engine */
  predictedScore?: number;
}

export interface Rating {
  id: string;
  userId: string;
  itemId: string;
  score: number;
  reviewText?: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  displayOrder: number;
}

export interface Profile {
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  avatarUrl?: string;
}

export interface ProfileStats {
  ratingsCount: number;
  avgScore: number;
  categoriesCount: number;
}

/** One entry in the user's rating history (profile screen) */
export interface MyRating {
  id: string;
  score: number;
  reviewText?: string;
  updatedAt: string;
  movie: { id: string; title: string; imageUrl?: string };
}

export interface AdminStats {
  totals: { users: number; movies: number; ratings: number; favorites: number; categories: number };
  avgScore: number;
  topMovies: { movieId: string; title: string; avgScore: number; ratingsCount: number }[];
  engine: { runs: number; avgMs: number; maxMs: number; knnRuns: number };
  recentLogs: {
    id: string;
    userEmail: string;
    source: 'knn' | 'popular';
    itemsCount: number;
    executionTimeMs: number;
    calculatedAt: string;
  }[];
}
