export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
}

/** פריט קטלוג (סרט) כמו שה-UI צורך */
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
  createdAt: string;
  tags: string[];
  /** מופיע רק בפריטים ממנוע ההמלצות */
  predictedScore?: number;
}

export interface Category {
  id: string;
  name: string;
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

export interface MyRating {
  id: string;
  score: number;
  updatedAt: string;
  movie: { id: string; title: string; imageUrl?: string };
}

/** שורה אחת ברשימת משתמשי הקהילה */
export interface UserSummary {
  id: string;
  email: string;
  role: UserRole;
  name: string | null;
  ratingsCount: number;
  topCategories: string[];
}
