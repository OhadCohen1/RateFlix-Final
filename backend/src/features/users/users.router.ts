import { Router } from 'express';
import { getUsersSummary } from './users.ctrl.ts';
import { protect } from '../../middlewares/auth.ts';

const router = Router();

router.get('/', protect, getUsersSummary);

export default router;
