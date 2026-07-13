import api from './api';
import type { CategoriesPayload, ApiCategory } from '../types/api';
import type { Category } from '../types';
import { mapApiCategory } from '../utils/mappers';

export const fetchCategories = async (): Promise<Category[]> => {
  const { categories } = await api.get<CategoriesPayload>('/categories');
  return categories.map(mapApiCategory);
};

/** Admin only */
export const createCategory = async (name: string): Promise<Category> => {
  const { category } = await api.post<{ category: ApiCategory }>('/categories', { name });
  return mapApiCategory(category);
};

/** Admin only */
export const deleteCategory = async (categoryId: string): Promise<void> => {
  await api.delete(`/categories/${categoryId}`);
};
