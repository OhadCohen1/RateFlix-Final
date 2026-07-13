import { Router } from 'express';
import { getCategories, createCategory, deleteCategory } from './categories.ctrl.ts';
import { protect, authorize } from '../../middlewares/auth.ts';

const router = Router();

router.route('/').get(getCategories).post(protect, authorize('admin'), createCategory);
router.delete('/:id', protect, authorize('admin'), deleteCategory);

export default router;
