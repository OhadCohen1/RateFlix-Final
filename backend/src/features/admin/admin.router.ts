import { Router } from 'express';
import { getAdminStats } from './admin.ctrl.ts';
import { protect, authorize } from '../../middlewares/auth.ts';

const router = Router();

router.get('/stats', protect, authorize('admin'), getAdminStats);

export default router;
