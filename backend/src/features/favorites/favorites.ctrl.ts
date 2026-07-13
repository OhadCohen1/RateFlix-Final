import type { Request, Response } from 'express';
import Favorite from './favorites.model.ts';
import Movie from '../movies/movies.model.ts';
import { ApiError } from '../../middlewares/errorHandler.ts';
import { buildSuccessResponse } from '../../utils/response.builder.ts';

const requireUserId = (req: Request): string => {
  const userId = req.user?.id;
  if (!userId) throw new ApiError(401, 'Not authorized');
  return userId;
};

// מחזיר את המועדפים של המשתמש.
export const getMyFavorites = async (req: Request, res: Response): Promise<void> => {
  const userId = requireUserId(req);
  const favorites = await Favorite.find({ userId }).sort({ addedAt: -1 });
  const movies = await Movie.find({ _id: { $in: favorites.map((f) => f.itemId) } });

  res.json(buildSuccessResponse({
    count: movies.length, movies }));
};

// מוסיף סרט למועדפים.
export const addFavorite = async (req: Request, res: Response): Promise<void> => {
  const userId = requireUserId(req);
  const movieId = req.params.id;

  const movie = await Movie.findById(movieId);
  if (!movie) throw new ApiError(404, 'Movie not found');

  // upsert מונע כפילויות בלחיצות חוזרות.
  await Favorite.findOneAndUpdate(
    { userId, itemId: movieId },
    { $setOnInsert: { addedAt: new Date() } },
    { upsert: true }
  );

  res.status(201).json(buildSuccessResponse({
    message: 'Added to favorites' }));
};

// מוריד סרט מהמועדפים.
export const removeFavorite = async (req: Request, res: Response): Promise<void> => {
  const userId = requireUserId(req);
  await Favorite.deleteOne({ userId, itemId: req.params.id });
  res.json(buildSuccessResponse({
    message: 'Removed from favorites' }));
};
