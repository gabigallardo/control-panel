import { Router } from 'express';
import { getDashboardMetrics } from '../controllers/dashboard.controller';

const router = Router();

router.get('/dashboard', getDashboardMetrics);

export default router;
