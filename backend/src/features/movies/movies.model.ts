import { Schema, model } from 'mongoose';
import type { IMovie } from './movies.types.ts';

const movieSchema = new Schema<IMovie>({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  categoryId: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
  },
  imageUrl: {
    type: String,
    trim: true,
  },
  year: {
    type: Number,
    min: 1888,
    max: 2100,
  },
  tags: {
    type: [String],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Movie = model<IMovie>('Movie', movieSchema);

export default Movie;
