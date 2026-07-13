import type { HydratedDocument, Types } from 'mongoose';

// שומרים לוג לכל הרצת המלצות בשביל ניטור.
export interface IRecommendationLog {
  userId: Types.ObjectId;
  recommendedItems: Types.ObjectId[];
  source: 'knn' | 'popular';
  calculatedAt: Date;
  executionTimeMs: number;
}

export type RecommendationLogDocument = HydratedDocument<IRecommendationLog>;
