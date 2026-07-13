import api from './api';
import type {
  ApiMovie,
  AuthPayload,
  MoviesPayload,
  RecommendationsPayload,
  CategoriesPayload,
  MyScoresPayload,
  ProfilePayload,
  UsersPayload,
} from './types';
import type { Item, Category, Profile, ProfileStats, MyRating, User, UserSummary } from '../types';

const mapMovieToItem = (movie: ApiMovie): Item => ({
  id: movie._id,
  name: movie.title,
  description: movie.description ?? '',
  categoryId: movie.categoryId,
  categoryName: movie.categoryName,
  imageUrl: movie.imageUrl,
  year: movie.createdAt ? new Date(movie.createdAt).getFullYear() : undefined,
  avgRating: movie.avgRating ?? 0,
  ratingCount: movie.ratingCount ?? 0,
  createdAt: movie.createdAt,
  tags: movie.tags ?? [],
  predictedScore: movie.predictedScore,
});

/* --------------------------------- Auth --------------------------------- */

export const loginRequest = (email: string, password: string): Promise<AuthPayload> =>
  api.post<AuthPayload>('/auth/login', { email, password });

export const registerRequest = (email: string, password: string): Promise<AuthPayload> =>
  api.post<AuthPayload>('/auth/register', { email, password });

/* -------------------------------- Catalog ------------------------------- */

export type CatalogSort = 'newest' | 'rating' | 'popular';

export const fetchMovies = async (
  query: { search?: string; category?: string; sort?: CatalogSort } = {}
): Promise<Item[]> => {
  const { movies } = await api.get<MoviesPayload>('/movies', {
    search: query.search,
    category: query.category,
    sort: query.sort,
  });
  return movies.map(mapMovieToItem);
};

export const fetchCategories = async (): Promise<Category[]> => {
  const { categories } = await api.get<CategoriesPayload>('/categories');
  return categories.map((c) => ({ id: c._id, name: c.name }));
};

/* -------------------------------- Ratings ------------------------------- */

export const rateMovie = async (itemId: string, score: number): Promise<void> => {
  await api.post(`/movies/${itemId}/rate`, { score });
};

export const deleteRating = async (itemId: string): Promise<void> => {
  await api.delete(`/movies/${itemId}/rate`);
};

export const fetchMyScores = async (): Promise<Record<string, number>> => {
  const { scores } = await api.get<MyScoresPayload>('/ratings/me');
  return scores;
};

/* ---------------------------- Recommendations --------------------------- */

export interface RecommendationsResult {
  source: 'knn' | 'popular';
  items: Item[];
}

export const fetchRecommendations = async (): Promise<RecommendationsResult> => {
  const { source, movies } = await api.get<RecommendationsPayload>('/recommendations');
  return { source, items: movies.map(mapMovieToItem) };
};

/* -------------------------------- Profile ------------------------------- */

export interface MyProfile {
  user: User;
  profile: Profile | null;
  stats: ProfileStats;
  ratings: MyRating[];
}

export const fetchMyProfile = async (): Promise<MyProfile> => {
  const payload = await api.get<ProfilePayload>('/profile');
  return {
    user: payload.user,
    profile: payload.profile,
    stats: payload.stats,
    ratings: payload.ratings.map((r) => ({
      id: r._id,
      score: r.score,
      updatedAt: r.updatedAt,
      movie: { id: r.movie._id, title: r.movie.title, imageUrl: r.movie.imageUrl },
    })),
  };
};

export const updateMyProfile = async (profile: Profile): Promise<void> => {
  await api.put('/profile', profile);
};

/* --------------------------------- Users -------------------------------- */

export const fetchUsersSummary = async (): Promise<UserSummary[]> => {
  const { users } = await api.get<UsersPayload>('/users');
  return users.map((u) => ({
    id: u._id,
    email: u.email,
    role: u.role,
    name: u.name,
    ratingsCount: u.ratingsCount,
    topCategories: u.topCategories,
  }));
};
