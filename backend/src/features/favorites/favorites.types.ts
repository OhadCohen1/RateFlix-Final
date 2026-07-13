import type { HydratedDocument, Types } from 'mongoose';

export interface IFavorite {
  userId: Types.ObjectId;
  itemId: Types.ObjectId;
  addedAt: Date;
}

export type FavoriteDocument = HydratedDocument<IFavorite>;
