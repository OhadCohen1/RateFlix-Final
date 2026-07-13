import Rating from '../features/ratings/ratings.model.ts';
import type { RatingsMatrix } from './KNNService.ts';

/**
 * In-memory cache of the full sparse ratings matrix { userId: { itemId: score } }.
 * Building the matrix requires pulling every rating from the DB; doing that on
 * every request would hammer Mongo and keep the single-threaded Event Loop busy
 * re-building large objects (NFR-01). The cache is rebuilt at most once per TTL,
 * and is invalidated immediately when a rating or movie changes so
 * recommendations never go stale.
 */
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface MatrixCache {
  matrix: RatingsMatrix | null;
  builtAt: number;
}

const cache: MatrixCache = { matrix: null, builtAt: 0 };

export const invalidateMatrixCache = (): void => {
  cache.matrix = null;
  cache.builtAt = 0;
};

export const getRatingsMatrix = async (): Promise<RatingsMatrix> => {
  const isFresh = cache.matrix !== null && Date.now() - cache.builtAt < CACHE_TTL_MS;
  if (isFresh && cache.matrix) return cache.matrix;

  const ratings = await Rating.find().select('userId itemId score').lean();

  const matrix: RatingsMatrix = {};
  for (const { userId, itemId, score } of ratings) {
    const user = userId.toString();
    if (!matrix[user]) matrix[user] = {};
    matrix[user][itemId.toString()] = score;
  }

  cache.matrix = matrix;
  cache.builtAt = Date.now();
  return matrix;
};
