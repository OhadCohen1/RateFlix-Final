import api from './api';
import type {
  MoviesPayload,
  MoviePayload,
  RatingPayload,
  RecommendationsPayload,
  MyScoresPayload,
} from '../types/api';
import type { Item, Rating } from '../types';
import { mapMovieToItem, mapApiRating } from '../utils/mappers';

export type CatalogSort = 'newest' | 'rating' | 'popular';

export interface CatalogQuery {
  search?: string;
  category?: string;
  sort?: CatalogSort;
}

export const fetchMovies = async (query: CatalogQuery = {}): Promise<Item[]> => {
  const { movies } = await api.get<MoviesPayload>('/movies', {
    search: query.search,
    category: query.category,
    sort: query.sort,
  });
  return movies.map(mapMovieToItem);
};

/** Admin only - multipart form with the poster image; the backend runs the AI enrichment */
export const createMovie = async (formData: FormData): Promise<Item> => {
  const { movie } = await api.post<MoviePayload>('/movies', formData);
  return mapMovieToItem(movie);
};

/** Admin only - removes the movie together with its ratings and favorites */
export const deleteMovie = async (itemId: string): Promise<void> => {
  await api.delete(`/movies/${itemId}`);
};

export const rateMovie = async (
  itemId: string,
  score: number,
  reviewText?: string
): Promise<Rating> => {
  const { rating } = await api.post<RatingPayload>(`/movies/${itemId}/rate`, {
    score,
    reviewText,
  });
  return mapApiRating(rating);
};

export const deleteRating = async (itemId: string): Promise<void> => {
  await api.delete(`/movies/${itemId}/rate`);
};

/** The current user's ratings as { itemId: score } - for "my rating" stars */
export const fetchMyScores = async (): Promise<Record<string, number>> => {
  const { scores } = await api.get<MyScoresPayload>('/ratings/me');
  return scores;
};

export const addFavorite = async (itemId: string): Promise<void> => {
  await api.post(`/movies/${itemId}/favorite`);
};

export const removeFavorite = async (itemId: string): Promise<void> => {
  await api.delete(`/movies/${itemId}/favorite`);
};

export const fetchFavorites = async (): Promise<Item[]> => {
  const { movies } = await api.get<MoviesPayload>('/favorites');
  return movies.map(mapMovieToItem);
};

export interface RecommendationsResult {
  source: 'knn' | 'popular';
  items: Item[];
}

export const fetchRecommendations = async (): Promise<RecommendationsResult> => {
  const { source, movies } = await api.get<RecommendationsPayload>('/recommendations');
  return { source, items: movies.map(mapMovieToItem) };
};
