import { Router } from 'express';
import { getMyProfile, updateMyProfile } from './profiles.ctrl.ts';
import { protect } from '../../middlewares/auth.ts';

const router = Router();

router.route('/').get(protect, getMyProfile).put(protect, updateMyProfile);

export default router;
