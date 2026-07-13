import { Schema, model } from 'mongoose';
import type { IRating } from './ratings.types.ts';

const ratingSchema = new Schema<IRating>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  itemId: {
    type: Schema.Types.ObjectId,
    ref: 'Movie',
    required: true,
  },
  score: {
    type: Number,
    required: [true, 'Score is required'],
    min: [1, 'Score must be between 1 and 5'],
    max: [5, 'Score must be between 1 and 5'],
  },
  reviewText: {
    type: String,
    trim: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// A user can rate a given movie only once (update instead of duplicate)
ratingSchema.index({ userId: 1, itemId: 1 }, { unique: true });

// Keep updatedAt current on every save
ratingSchema.pre('save', function (): void {
  this.updatedAt = new Date();
});

const Rating = model<IRating>('Rating', ratingSchema);

export default Rating;
