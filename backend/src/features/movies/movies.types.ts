import type { HydratedDocument, Types } from 'mongoose';

export interface IMovie {
  title: string;
  description?: string;
  categoryId?: Types.ObjectId;
  imageUrl?: string;
  year?: number;
  tags: string[];
  createdAt: Date;
}

export type MovieDocument = HydratedDocument<IMovie>;
