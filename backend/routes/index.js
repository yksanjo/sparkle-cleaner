import express from 'express';
import { stripeRouter } from './stripe.js';
import { cleanupRouter } from './cleanup.js';
import { analyzeRouter } from './analyze.js';

const router = express.Router();

router.use('/stripe', stripeRouter);
router.use('/cleanup', cleanupRouter);
router.use('/analyze', analyzeRouter);

export { router as routes };
