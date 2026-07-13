import type { Request, Response } from 'express';
import Category from './categories.model.ts';
import Movie from '../movies/movies.model.ts';
import { ApiError } from '../../middlewares/errorHandler.ts';
import { buildSuccessResponse } from '../../utils/response.builder.ts';

// GET /api/categories
export const getCategories = async (_req: Request, res: Response): Promise<void> => {
  const categories = await Category.find().sort({ displayOrder: 1, name: 1 });
  res.json(buildSuccessResponse({
    count: categories.length, categories }));
};

interface CategoryBody {
  name?: string;
  slug?: string;
  displayOrder?: number;
}

// POST /api/categories  (admin only)
export const createCategory = async (req: Request, res: Response): Promise<void> => {
  const { name, slug, displayOrder } = req.body as CategoryBody;

  if (!name?.trim()) {
    throw new ApiError(400, 'name is required');
  }

  const existing = await Category.findOne({ name: name.trim() });
  if (existing) {
    throw new ApiError(409, 'A category with this name already exists');
  }

  const category = await Category.create({ name: name.trim(), slug, displayOrder });
  res.status(201).json(buildSuccessResponse({
    category }));
};

// DELETE /api/categories/:id  (admin only)
export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) {
    throw new ApiError(404, 'Category not found');
  }

  // Detach the category from movies instead of deleting them
  await Movie.updateMany({ categoryId: category._id }, { $unset: { categoryId: '' } });

  res.json(buildSuccessResponse({
    message: 'Category deleted' }));
};
