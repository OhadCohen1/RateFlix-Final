import type { ApiMovie, ApiRating, ApiCategory, ApiMyRating } from '../types/api';
import type { Item, Rating, Category, MyRating } from '../types';

/** ממפה מסמך סרט מה-API לצורת Item של ה-UI */
export const mapMovieToItem = (movie: ApiMovie): Item => ({
  id: movie._id,
  name: movie.title,
  description: movie.description ?? '',
  categoryId: movie.categoryId,
  categoryName: movie.categoryName,
  imageUrl: movie.imageUrl,
  year: movie.year ?? (movie.createdAt ? new Date(movie.createdAt).getFullYear() : undefined),
  avgRating: movie.avgRating ?? 0,
  ratingCount: movie.ratingCount ?? 0,
  createdAt: movie.createdAt,
  tags: movie.tags ?? [],
  predictedScore: movie.predictedScore,
});

export const mapApiRating = (rating: ApiRating): Rating => ({
  id: rating._id,
  userId: rating.userId,
  itemId: rating.itemId,
  score: rating.score,
  reviewText: rating.reviewText,
  updatedAt: rating.updatedAt,
});

export const mapApiCategory = (category: ApiCategory): Category => ({
  id: category._id,
  name: category.name,
  slug: category.slug,
  displayOrder: category.displayOrder,
});

export const mapApiMyRating = (rating: ApiMyRating): MyRating => ({
  id: rating._id,
  score: rating.score,
  reviewText: rating.reviewText,
  updatedAt: rating.updatedAt,
  movie: {
    id: rating.movie._id,
    title: rating.movie.title,
    imageUrl: rating.movie.imageUrl,
  },
});
