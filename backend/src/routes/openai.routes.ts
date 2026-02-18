// ─── OpenAI Routes ─────────────────────────────────────────────────────

import { Router } from 'express';
import { getOpenAiBilling } from '../controllers/openai.controller';

const router = Router();

router.get('/billing', getOpenAiBilling);

export default router;
