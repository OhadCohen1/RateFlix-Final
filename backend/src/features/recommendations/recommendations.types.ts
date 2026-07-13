import type { HydratedDocument, Types } from 'mongoose';

/**
 * Audit log of every recommendations computation - documents the engine's
 * real-world response times (NFR-01: sub-second responses).
 */
export interface IRecommendationLog {
  userId: Types.ObjectId;
  recommendedItems: Types.ObjectId[];
  source: 'knn' | 'popular';
  calculatedAt: Date;
  executionTimeMs: number;
}

export type RecommendationLogDocument = HydratedDocument<IRecommendationLog>;
