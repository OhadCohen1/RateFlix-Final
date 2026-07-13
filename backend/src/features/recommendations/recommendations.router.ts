import { Router } from 'express';
import {
  rateMovie,
  deleteRating,
  getMyRatings,
  getRecommendations,
} from './recommendations.ctrl.ts';
import { addFavorite, removeFavorite, getMyFavorites } from '../favorites/favorites.ctrl.ts';
import { protect } from '../../middlewares/auth.ts';

const router = Router();

// Ratings (FR-03: create/update/delete)
router.post('/movies/:id/rate', protect, rateMovie);
router.delete('/movies/:id/rate', protect, deleteRating);
router.get('/ratings/me', protect, getMyRatings);

// Favorites
router.post('/movies/:id/favorite', protect, addFavorite);
router.delete('/movies/:id/favorite', protect, removeFavorite);
router.get('/favorites', protect, getMyFavorites);

// Recommendations feed (FR-04)
router.get('/recommendations', protect, getRecommendations);

export default router;
