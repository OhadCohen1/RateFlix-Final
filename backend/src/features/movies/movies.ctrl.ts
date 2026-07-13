import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import type { QueryFilter } from 'mongoose';
import Movie from './movies.model.ts';
import type { IMovie } from './movies.types.ts';
import Rating from '../ratings/ratings.model.ts';
import Favorite from '../favorites/favorites.model.ts';
import Category from '../categories/categories.model.ts';
import { uploadImageBuffer } from '../../middlewares/files.ts';
import { generateMovieMetadata } from '../../services/AIService.ts';
import { ApiError } from '../../middlewares/errorHandler.ts';
import { invalidateMatrixCache } from '../../services/matrixCache.ts';
import { buildSuccessResponse } from '../../utils/response.builder.ts';

type SortOption = 'newest' | 'rating' | 'popular' | 'year';

interface RatingAggregation {
  _id: Types.ObjectId;
  avgScore: number;
  ratingsCount: number;
}

// קטלוג סרטים עם חיפוש, סינון ומיון.
export const getMovies = async (req: Request, res: Response): Promise<void> => {
  const search = typeof req.query.search === 'string' ? req.query.search : undefined;
  const category = typeof req.query.category === 'string' ? req.query.category : undefined;
  const sort = (typeof req.query.sort === 'string' ? req.query.sort : 'newest') as SortOption;

  const filter: QueryFilter<IMovie> = {};
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { tags: { $regex: search, $options: 'i' } },
    ];
  }
  if (category && Types.ObjectId.isValid(category)) {
    filter.categoryId = category;
  }

  const [movies, ratingAgg] = await Promise.all([
    Movie.find(filter)
      .populate<{ categoryId: { _id: Types.ObjectId; name: string } | null }>('categoryId', 'name')
      .lean(),
    Rating.aggregate<RatingAggregation>([
      { $group: { _id: '$itemId', avgScore: { $avg: '$score' }, ratingsCount: { $sum: 1 } } },
    ]),
  ]);

  const aggById = new Map(ratingAgg.map((a) => [a._id.toString(), a]));
  const enriched = movies.map((movie) => {
    const agg = aggById.get(movie._id.toString());
    const { categoryId, ...rest } = movie;
    return {
      ...rest,
      categoryId: categoryId?._id,
      categoryName: categoryId?.name,
      avgRating: agg ? Number(agg.avgScore.toFixed(1)) : 0,
      ratingCount: agg?.ratingsCount ?? 0,
    };
  });

  switch (sort) {
    case 'rating':
      enriched.sort((a, b) => b.avgRating - a.avgRating || b.ratingCount - a.ratingCount);
      break;
    case 'popular':
      enriched.sort((a, b) => b.ratingCount - a.ratingCount || b.avgRating - a.avgRating);
      break;
    case 'year':
    case 'newest':
    default:
      enriched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
  }

  res.json(buildSuccessResponse({
    count: enriched.length, movies: enriched }));
};

interface CreateMovieBody {
  title?: string;
  description?: string;
  categoryId?: string;
}

// יצירת סרט חדש (אדמין).
export const createMovie = async (req: Request, res: Response): Promise<void> => {
  const { title, categoryId } = req.body as CreateMovieBody;

  if (!title) {
    throw new ApiError(400, 'title is required');
  }

  let imageUrl: string | undefined;
  if (req.file) {
    try {
      const uploadResult = await uploadImageBuffer(req.file.buffer);
      imageUrl = uploadResult.secure_url;
    } catch (error) {
      // אם העלאת פוסטר נכשלה, ממשיכים בלי לעצור את היצירה.
      const message = error instanceof Error ? error.message : JSON.stringify(error);
      console.warn(`Cloudinary upload failed for "${title}": ${message}`);
    }
  }

  // אם categoryId לא תקין, מתעלמים ממנו.
  const validCategoryId =
    categoryId && Types.ObjectId.isValid(categoryId) ? categoryId : undefined;
  if (categoryId && !validCategoryId) {
    console.warn(`Ignoring invalid categoryId "${categoryId}" for movie "${title}"`);
  }

  let description = (req.body as CreateMovieBody).description;
  let tags: string[] = [];
  try {
    const metadata = await generateMovieMetadata(title);
    description = metadata.synopsis;
    tags = metadata.tags;
  } catch (error) {
    // גם אם AI נופל, שומרים את הסרט עם הנתונים הידניים.
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`Gemini metadata generation failed for "${title}": ${message}`);
  }

  const movie = await Movie.create({ title, description, categoryId: validCategoryId, imageUrl, tags });

  // מחזירים גם שם קטגוריה לרינדור מיידי בצד לקוח.
  const category = validCategoryId ? await Category.findById(validCategoryId) : null;

  res.status(201).json(buildSuccessResponse({
    movie: { ...movie.toObject(), categoryName: category?.name },
  }));
};

// מחיקת סרט והניקוי הנלווה.
export const deleteMovie = async (req: Request, res: Response): Promise<void> => {
  const movie = await Movie.findByIdAndDelete(req.params.id);
  if (!movie) {
    throw new ApiError(404, 'Movie not found');
  }

  await Promise.all([
    Rating.deleteMany({ itemId: movie._id }),
    Favorite.deleteMany({ itemId: movie._id }),
  ]);
  invalidateMatrixCache();

  res.json(buildSuccessResponse({
    message: 'Movie deleted' }));
};
