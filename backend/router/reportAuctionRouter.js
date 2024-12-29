import express from 'express';
import { createReport } from '../controllers/reportAuctionController.js';
import { isAuthenticated } from '../middlewares/auth.js';

const router = express.Router();

router.post('/report-auction', isAuthenticated, createReport);

export default router;
