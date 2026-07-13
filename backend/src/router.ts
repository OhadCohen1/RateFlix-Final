import { Router } from 'express';
import authRoutes from './features/auth/auth.router.ts';
import movieRoutes from './features/movies/movies.router.ts';
import categoryRoutes from './features/categories/categories.router.ts';
import profileRoutes from './features/profiles/profiles.router.ts';
import adminRoutes from './features/admin/admin.router.ts';
import userRoutes from './features/users/users.router.ts';
import recommendationRoutes from './features/recommendations/recommendations.router.ts';

/**
 * Central API router - aggregates every feature router under /api,
 * so app.ts stays a thin bootstrap file.
 */
const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/movies', movieRoutes);
apiRouter.use('/categories', categoryRoutes);
apiRouter.use('/profile', profileRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/', recommendationRoutes); // ratings, favorites, recommendations

export default apiRouter;
