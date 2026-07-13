import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import User from '../users/users.model.ts';
import Movie from '../movies/movies.model.ts';
import Rating from '../ratings/ratings.model.ts';
import Favorite from '../favorites/favorites.model.ts';
import Category from '../categories/categories.model.ts';
import RecommendationLog from '../recommendations/recommendations.model.ts';
import { buildSuccessResponse } from '../../utils/response.builder.ts';

interface TopMovieAggregation {
  _id: Types.ObjectId;
  avgScore: number;
  ratingsCount: number;
}

interface EngineAggregation {
  _id: null;
  avgMs: number;
  maxMs: number;
  runs: number;
}

// סטטיסטיקות לדאשבורד אדמין.
export const getAdminStats = async (_req: Request, res: Response): Promise<void> => {
  const [users, movies, ratings, favorites, categories] = await Promise.all([
    User.countDocuments(),
    Movie.countDocuments(),
    Rating.countDocuments(),
    Favorite.countDocuments(),
    Category.countDocuments(),
  ]);

  const [scoreAgg] = await Rating.aggregate<{ _id: null; avgScore: number }>([
    { $group: { _id: null, avgScore: { $avg: '$score' } } },
  ]);

  const topAgg = await Rating.aggregate<TopMovieAggregation>([
    { $group: { _id: '$itemId', avgScore: { $avg: '$score' }, ratingsCount: { $sum: 1 } } },
    { $sort: { avgScore: -1, ratingsCount: -1 } },
    { $limit: 5 },
  ]);
  const topMovieDocs = await Movie.find({ _id: { $in: topAgg.map((t) => t._id) } });
  const titleById = new Map(topMovieDocs.map((m) => [m._id.toString(), m.title]));

  const [engineAgg] = await RecommendationLog.aggregate<EngineAggregation>([
    {
      $group: {
        _id: null,
        avgMs: { $avg: '$executionTimeMs' },
        maxMs: { $max: '$executionTimeMs' },
        runs: { $sum: 1 },
      },
    },
  ]);

  // כמה מהריצות הגיעו מ-KNN לעומת פולבק פופולרי.
  const sourceAgg = await RecommendationLog.aggregate<{ _id: 'knn' | 'popular'; runs: number }>([
    { $group: { _id: '$source', runs: { $sum: 1 } } },
  ]);
  const knnRuns = sourceAgg.find((s) => s._id === 'knn')?.runs ?? 0;

  const recentLogs = await RecommendationLog.find()
    .sort({ calculatedAt: -1 })
    .limit(10)
    .populate<{ userId: { email: string } | null }>('userId', 'email');

  res.json(buildSuccessResponse({
    totals: { users, movies, ratings, favorites, categories },
    avgScore: scoreAgg ? Number(scoreAgg.avgScore.toFixed(2)) : 0,
    topMovies: topAgg.map((t) => ({
      movieId: t._id,
      title: titleById.get(t._id.toString()) ?? '(נמחק)',
      avgScore: Number(t.avgScore.toFixed(2)),
      ratingsCount: t.ratingsCount,
    })),
    engine: {
      runs: engineAgg?.runs ?? 0,
      avgMs: engineAgg ? Number(engineAgg.avgMs.toFixed(1)) : 0,
      maxMs: engineAgg?.maxMs ?? 0,
      knnRuns,
    },
    recentLogs: recentLogs.map((log) => ({
      _id: log._id,
      userEmail: log.userId?.email ?? '(נמחק)',
      source: log.source,
      itemsCount: log.recommendedItems.length,
      executionTimeMs: log.executionTimeMs,
      calculatedAt: log.calculatedAt,
    })),
  }));
};
