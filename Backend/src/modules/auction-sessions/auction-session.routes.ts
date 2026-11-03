import { Router } from 'express';
import { AuctionSessionController } from './auction-session.controller.ts';
import { authenticateToken } from '../../middleware/auth.middleware.ts';

const router = Router({ mergeParams: true });

// Start / State
router.post('/start', authenticateToken, AuctionSessionController.startSession);
router.get('/current', AuctionSessionController.getState);
router.get('/state', AuctionSessionController.getState);

// Player Selection (Random / Manual)
router.post('/players/select-random', authenticateToken, AuctionSessionController.selectRandomPlayer);
router.post('/players/select', authenticateToken, AuctionSessionController.selectManualPlayer);
router.get('/eligible-players', AuctionSessionController.getEligiblePlayers);

// Bidding Engine Controls
router.post('/bid-up', authenticateToken, AuctionSessionController.bidUp);
router.post('/bid-down', authenticateToken, AuctionSessionController.bidDown);
router.post('/sell', authenticateToken, AuctionSessionController.sellPlayer);
router.post('/unsold', authenticateToken, AuctionSessionController.markUnsold);

// State Machine Lifecycle
router.post('/pause', authenticateToken, AuctionSessionController.pauseSession);
router.post('/resume', authenticateToken, AuctionSessionController.resumeSession);
router.post('/complete', authenticateToken, AuctionSessionController.completeSession);

// Audit & Tracking
router.get('/tracking', AuctionSessionController.getTrackingBids);

export default router;
