import { Schema, model } from 'mongoose';
import type { IRecommendationLog } from './recommendations.types.ts';

const recommendationLogSchema = new Schema<IRecommendationLog>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  recommendedItems: {
    type: [Schema.Types.ObjectId],
    ref: 'Movie',
    default: [],
  },
  source: {
    type: String,
    enum: ['knn', 'popular'],
    required: true,
  },
  calculatedAt: {
    type: Date,
    default: Date.now,
  },
  executionTimeMs: {
    type: Number,
    required: true,
  },
});

const RecommendationLog = model<IRecommendationLog>('RecommendationLog', recommendationLogSchema);

export default RecommendationLog;
