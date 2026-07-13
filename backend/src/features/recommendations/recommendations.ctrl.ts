import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import Rating from '../ratings/ratings.model.ts';
import Movie from '../movies/movies.model.ts';
import type { IMovie } from '../movies/movies.types.ts';
import RecommendationLog from './recommendations.model.ts';
import { getRecommendations as knnRecommend } from '../../services/KNNService.ts';
import { getRatingsMatrix, invalidateMatrixCache } from '../../services/matrixCache.ts';
import { ApiError } from '../../middlewares/errorHandler.ts';
import { buildSuccessResponse } from '../../utils/response.builder.ts';

const requireUserId = (req: Request): string => {
  const userId = req.user?.id;
  if (!userId) throw new ApiError(401, 'Not authorized');
  return userId;
};

interface RateBody {
  score?: number;
  reviewText?: string;
}

// POST /api/movies/:id/rate  (protected)
// Creates the rating on first call, updates it on subsequent calls (upsert)
export const rateMovie = async (req: Request, res: Response): Promise<void> => {
  const userId = requireUserId(req);
  const { score, reviewText } = req.body as RateBody;
  const movieId = req.params.id;

  if (score === undefined || score < 1 || score > 5) {
    throw new ApiError(400, 'score is required and must be between 1 and 5');
  }

  const movie = await Movie.findById(movieId);
  if (!movie) {
    throw new ApiError(404, 'Movie not found');
  }

  const rating = await Rating.findOneAndUpdate(
    { userId, itemId: movieId },
    { score, reviewText, updatedAt: new Date() },
    { returnDocument: 'after', upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );

  // The matrix changed - force a rebuild on the next recommendations request
  invalidateMatrixCache();

  res.status(201).json(buildSuccessResponse({
    rating }));
};

// DELETE /api/movies/:id/rate  (protected) - FR-03: a user may remove their rating
export const deleteRating = async (req: Request, res: Response): Promise<void> => {
  const userId = requireUserId(req);

  const deleted = await Rating.findOneAndDelete({ userId, itemId: req.params.id });
  if (!deleted) {
    throw new ApiError(404, 'You have not rated this movie');
  }

  invalidateMatrixCache();
  res.json(buildSuccessResponse({
    message: 'Rating removed' }));
};

// GET /api/ratings/me  (protected) - the user's ratings as { itemId: score },
// used by the catalog to render "my rating" stars on each card
export const getMyRatings = async (req: Request, res: Response): Promise<void> => {
  const userId = requireUserId(req);
  const ratings = await Rating.find({ userId }).select('itemId score');

  const scores: Record<string, number> = {};
  for (const r of ratings) {
    scores[r.itemId.toString()] = r.score;
  }

  res.json(buildSuccessResponse({
    scores }));
};

// Cold-start fallback: the most popular movies globally, ranked by average
// score (weighted by how many users rated them)
const getTopRatedMovies = async (limit = 10) => {
  const top = await Rating.aggregate<{ _id: Types.ObjectId; avgScore: number; ratingsCount: number }>([
    {
      $group: {
        _id: '$itemId',
        avgScore: { $avg: '$score' },
        ratingsCount: { $sum: 1 },
      },
    },
    { $sort: { avgScore: -1, ratingsCount: -1 } },
    { $limit: limit },
  ]);

  const movies = await Movie.find({ _id: { $in: top.map((t) => t._id) } })
    .populate<{ categoryId: { _id: Types.ObjectId; name: string } | null }>('categoryId', 'name')
    .lean();
  const movieById = new Map(movies.map((m) => [m._id.toString(), m]));

  return top
    .filter((t) => movieById.has(t._id.toString()))
    .map((t) => {
      const { categoryId, ...movie } = movieById.get(t._id.toString())!;
      return {
        ...(movie as IMovie & { _id: Types.ObjectId }),
        categoryId: categoryId?._id,
        categoryName: categoryId?.name,
        avgRating: Number(t.avgScore.toFixed(1)),
        ratingCount: t.ratingsCount,
        predictedScore: Number(t.avgScore.toFixed(2)),
      };
    });
};

// Persists an audit entry for the analytics dashboard without delaying the response
const logRecommendation = (
  userId: string,
  source: 'knn' | 'popular',
  itemIds: (string | Types.ObjectId)[],
  executionTimeMs: number
): void => {
  RecommendationLog.create({ userId, source, recommendedItems: itemIds, executionTimeMs }).catch(
    (error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`Failed to write recommendation log: ${message}`);
    }
  );
};

// GET /api/recommendations  (protected)
export const getRecommendations = async (req: Request, res: Response): Promise<void> => {
  const userId = requireUserId(req);
  const startedAt = Date.now();

  const matrix = await getRatingsMatrix();
  const userRatings = matrix[userId];

  // Cold start: the user has not rated anything yet, so KNN has no signal -
  // fall back to the top globally rated movies
  if (!userRatings || Object.keys(userRatings).length === 0) {
    const movies = await getTopRatedMovies();
    logRecommendation(userId, 'popular', movies.map((m) => m._id), Date.now() - startedAt);
    res.json(buildSuccessResponse({
    source: 'popular', count: movies.length, movies }));
    return;
  }

  const recommendations = knnRecommend(userId, matrix, 3);

  // The user has ratings but no overlapping neighbors (or neighbors rated
  // nothing new) - treat it as cold start as well
  if (recommendations.length === 0) {
    const movies = await getTopRatedMovies();
    logRecommendation(userId, 'popular', movies.map((m) => m._id), Date.now() - startedAt);
    res.json(buildSuccessResponse({
    source: 'popular', count: movies.length, movies }));
    return;
  }

  // Replace bare itemIds with the full movie documents
  const movieDocs = await Movie.find({
    _id: { $in: recommendations.map((r) => r.itemId) },
  })
    .populate<{ categoryId: { _id: Types.ObjectId; name: string } | null }>('categoryId', 'name')
    .lean();
  const movieById = new Map(movieDocs.map((m) => [m._id.toString(), m]));

  const movies = [];
  for (const rec of recommendations) {
    const doc = movieById.get(rec.itemId);
    if (doc) {
      const { categoryId, ...movie } = doc;
      movies.push({
        ...movie,
        categoryId: categoryId?._id,
        categoryName: categoryId?.name,
        predictedScore: Number(rec.predictedScore.toFixed(2)),
      });
    }
  }

  logRecommendation(userId, 'knn', movies.map((m) => m._id), Date.now() - startedAt);
  res.json(buildSuccessResponse({
    source: 'knn', count: movies.length, movies }));
};
