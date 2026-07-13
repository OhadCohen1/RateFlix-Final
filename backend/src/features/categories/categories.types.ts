import type { HydratedDocument } from 'mongoose';

export interface ICategory {
  name: string;
  slug: string;
  displayOrder: number;
}

export type CategoryDocument = HydratedDocument<ICategory>;
