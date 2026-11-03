import { Router } from 'express';
import { AuctionController } from './auction.controller.ts';
import {
  authenticateToken,
  optionalAuth,
  requireAdmin,
} from '../../middleware/auth.middleware.ts';

const router = Router();

// =================== PUBLIC & USER AUCTION ROUTES ===================
// GET /api/v1/auctions (Public list, with optional user token to show permitted private auctions)
router.get('/', optionalAuth as any, AuctionController.list as any);

// GET /api/v1/auctions/:id (Retrieve auction, enforcing private visibility checks)
router.get('/:id', optionalAuth as any, AuctionController.getById as any);

// POST /api/v1/auctions/:id/access-requests (User requests private auction access)
router.post(
  '/:id/access-requests',
  authenticateToken as any,
  AuctionController.requestAccess as any
);

// GET /api/v1/auctions/:id/access-requests/me (User checks own access status)
router.get(
  '/:id/access-requests/me',
  authenticateToken as any,
  AuctionController.getMyAccessStatus as any
);

// =================== ADMIN AUCTION CRUD & LIFECYCLE ===================
// POST /api/v1/auctions (Create auction)
router.post(
  '/',
  authenticateToken as any,
  requireAdmin as any,
  AuctionController.create as any
);

// PATCH /api/v1/auctions/:id (Update auction details)
router.patch(
  '/:id',
  authenticateToken as any,
  requireAdmin as any,
  AuctionController.update as any
);

// DELETE /api/v1/auctions/:id (Delete/archive auction)
router.delete(
  '/:id',
  authenticateToken as any,
  requireAdmin as any,
  AuctionController.delete as any
);

// POST /api/v1/auctions/:id/publish
router.post(
  '/:id/publish',
  authenticateToken as any,
  requireAdmin as any,
  AuctionController.publish as any
);

// POST /api/v1/auctions/:id/cancel
router.post(
  '/:id/cancel',
  authenticateToken as any,
  requireAdmin as any,
  AuctionController.cancel as any
);

// POST /api/v1/auctions/:id/archive
router.post(
  '/:id/archive',
  authenticateToken as any,
  requireAdmin as any,
  AuctionController.archive as any
);

// GET /api/v1/auctions/:id/access-requests (Admin views requests for specific auction)
router.get(
  '/:id/access-requests',
  authenticateToken as any,
  requireAdmin as any,
  AuctionController.listRequestsForAuction as any
);

// DELETE /api/v1/auctions/:id/participants/:userId (Admin revokes participant access)
router.delete(
  '/:id/participants/:userId',
  authenticateToken as any,
  requireAdmin as any,
  AuctionController.revokeAccess as any
);

// =================== EXPORT SETTINGS & DISPLAY LAYOUT ===================
// GET & PUT /api/v1/auctions/:id/export-settings
router.get('/:id/export-settings', optionalAuth as any, AuctionController.getExportSettings as any);
router.put('/:id/export-settings', authenticateToken as any, requireAdmin as any, AuctionController.updateExportSettings as any);

// GET & PUT /api/v1/auctions/:id/display-layout
router.get('/:id/display-layout', optionalAuth as any, AuctionController.getDisplayLayout as any);
router.put('/:id/display-layout', authenticateToken as any, requireAdmin as any, AuctionController.updateDisplayLayout as any);

// Players.md alias: GET & PUT /api/v1/auctions/:id/forms/player/display
router.get('/:id/forms/player/display', optionalAuth as any, AuctionController.getDisplayLayout as any);
router.put('/:id/forms/player/display', authenticateToken as any, requireAdmin as any, AuctionController.updateDisplayLayout as any);

export default router;
