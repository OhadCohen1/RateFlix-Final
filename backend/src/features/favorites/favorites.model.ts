import { Schema, model } from 'mongoose';
import type { IFavorite } from './favorites.types.ts';

const favoriteSchema = new Schema<IFavorite>({
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
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

// כל סרט יכול להופיע פעם אחת במועדפים של אותו משתמש.
favoriteSchema.index({ userId: 1, itemId: 1 }, { unique: true });

const Favorite = model<IFavorite>('Favorite', favoriteSchema);

export default Favorite;
