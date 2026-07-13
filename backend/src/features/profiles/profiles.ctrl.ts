import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import Profile from './profiles.model.ts';
import User from '../users/users.model.ts';
import Rating from '../ratings/ratings.model.ts';
import { ApiError } from '../../middlewares/errorHandler.ts';
import { buildSuccessResponse } from '../../utils/response.builder.ts';

const requireUserId = (req: Request): string => {
  const userId = req.user?.id;
  if (!userId) throw new ApiError(401, 'Not authorized');
  return userId;
};

// כל הנתונים למסך פרופיל בבקשה אחת.
export const getMyProfile = async (req: Request, res: Response): Promise<void> => {
  const userId = requireUserId(req);

  const [user, profile, ratings] = await Promise.all([
    User.findById(userId),
    Profile.findOne({ userId }),
    Rating.find({ userId })
      .sort({ updatedAt: -1 })
      .populate<{ itemId: { _id: Types.ObjectId; title: string; imageUrl?: string; categoryId?: Types.ObjectId } | null }>(
        'itemId',
        'title imageUrl categoryId'
      ),
  ]);

  if (!user) throw new ApiError(404, 'User not found');

  // סטטיסטיקות קצרות לכותרת הפרופיל.
  const ratedCategoryIds = new Set<string>();
  let scoreSum = 0;
  for (const r of ratings) {
    scoreSum += r.score;
    if (r.itemId?.categoryId) ratedCategoryIds.add(r.itemId.categoryId.toString());
  }

  res.json(buildSuccessResponse({
    user: { id: user._id, email: user.email, role: user.role, createdAt: user.createdAt },
    profile,
    stats: {
      ratingsCount: ratings.length,
      avgScore: ratings.length ? Number((scoreSum / ratings.length).toFixed(1)) : 0,
      categoriesCount: ratedCategoryIds.size,
    },
    ratings: ratings
      .filter((r) => r.itemId !== null)
      .map((r) => ({
        _id: r._id,
        score: r.score,
        reviewText: r.reviewText,
        updatedAt: r.updatedAt,
        movie: {
          _id: r.itemId!._id,
          title: r.itemId!.title,
          imageUrl: r.itemId!.imageUrl,
        },
      })),
  }));
};

interface ProfileBody {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  avatarUrl?: string;
}

// עדכון פרופיל (נוצר אוטומטית אם עוד לא קיים).
export const updateMyProfile = async (req: Request, res: Response): Promise<void> => {
  const userId = requireUserId(req);
  const { firstName, lastName, phoneNumber, avatarUrl } = req.body as ProfileBody;

  if (!firstName?.trim() || !lastName?.trim()) {
    throw new ApiError(400, 'firstName and lastName are required');
  }

  const profile = await Profile.findOneAndUpdate(
    { userId },
    { firstName: firstName.trim(), lastName: lastName.trim(), phoneNumber, avatarUrl },
    { returnDocument: 'after', upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );

  res.json(buildSuccessResponse({
    profile }));
};
