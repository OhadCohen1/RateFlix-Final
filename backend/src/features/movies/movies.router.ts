import { Router } from 'express';
import { getMovies, createMovie, deleteMovie } from './movies.ctrl.ts';
import { protect, authorize } from '../../middlewares/auth.ts';
import { saveToMemory } from '../../middlewares/files.ts';

const router = Router();

router
  .route('/')
  .get(getMovies)
  .post(protect, authorize('admin'), saveToMemory.single('image'), createMovie);

router.delete('/:id', protect, authorize('admin'), deleteMovie);

export default router;
