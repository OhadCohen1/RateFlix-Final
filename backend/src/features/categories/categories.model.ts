import { Schema, model } from 'mongoose';
import type { ICategory } from './categories.types.ts';

const categorySchema = new Schema<ICategory>({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true,
  },
  slug: {
    type: String,
    trim: true,
    lowercase: true,
    default: '',
  },
  displayOrder: {
    type: Number,
    default: 0,
  },
});

const Category = model<ICategory>('Category', categorySchema);

export default Category;
