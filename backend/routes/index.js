import express from 'express';
import { stripeRouter } from './stripe.js';
import { cleanupRouter } from './cleanup.js';

const router = express.Router();

router.use('/stripe', stripeRouter);
router.use('/cleanup', cleanupRouter);

export { router as routes };
