import type { HydratedDocument, Types } from 'mongoose';

export interface IRating {
  userId: Types.ObjectId;
  itemId: Types.ObjectId;
  score: number;
  reviewText?: string;
  updatedAt: Date;
}

export type RatingDocument = HydratedDocument<IRating>;
