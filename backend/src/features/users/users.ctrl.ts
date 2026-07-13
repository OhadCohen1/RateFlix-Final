import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import User from './users.model.ts';
import Profile from '../profiles/profiles.model.ts';
import Rating from '../ratings/ratings.model.ts';
import Category from '../categories/categories.model.ts';
import { buildSuccessResponse } from '../../utils/response.builder.ts';

interface UserCategoryAggregation {
  _id: { userId: Types.ObjectId; categoryId: Types.ObjectId | null };
  count: number;
}

// GET /api/users  (protected)
// Community summary powering the "users" tab: every registered user with
// their display name, ratings count and most-rated categories. This is the
// visible pool the KNN engine draws neighbors from.
export const getUsersSummary = async (_req: Request, res: Response): Promise<void> => {
  const [users, profiles, ratingCounts, categoryAgg, categories] = await Promise.all([
    User.find({ isActive: true }).select('email role createdAt').lean(),
    Profile.find().lean(),
    Rating.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $group: { _id: '$userId', count: { $sum: 1 } } },
    ]),
    Rating.aggregate<UserCategoryAggregation>([
      { $lookup: { from: 'movies', localField: 'itemId', foreignField: '_id', as: 'movie' } },
      { $unwind: '$movie' },
      {
        $group: {
          _id: { userId: '$userId', categoryId: '$movie.categoryId' },
          count: { $sum: 1 },
        },
      },
    ]),
    Category.find().lean(),
  ]);

  const profileByUser = new Map(profiles.map((p) => [p.userId.toString(), p]));
  const countByUser = new Map(ratingCounts.map((r) => [r._id.toString(), r.count]));
  const categoryName = new Map(categories.map((c) => [c._id.toString(), c.name]));

  // Top-2 most rated category names per user
  const topCategoriesByUser = new Map<string, string[]>();
  const grouped = new Map<string, { name: string; count: number }[]>();
  for (const row of categoryAgg) {
    if (!row._id.categoryId) continue;
    const name = categoryName.get(row._id.categoryId.toString());
    if (!name) continue;
    const userId = row._id.userId.toString();
    if (!grouped.has(userId)) grouped.set(userId, []);
    grouped.get(userId)!.push({ name, count: row.count });
  }
  for (const [userId, entries] of grouped) {
    entries.sort((a, b) => b.count - a.count);
    topCategoriesByUser.set(userId, entries.slice(0, 2).map((e) => e.name));
  }

  const summary = users
    .map((user) => {
      const id = user._id.toString();
      const profile = profileByUser.get(id);
      return {
        _id: user._id,
        email: user.email,
        role: user.role,
        name: profile ? `${profile.firstName} ${profile.lastName}` : null,
        ratingsCount: countByUser.get(id) ?? 0,
        topCategories: topCategoriesByUser.get(id) ?? [],
      };
    })
    .sort((a, b) => b.ratingsCount - a.ratingsCount);

  res.json(buildSuccessResponse({
    count: summary.length, users: summary }));
};
