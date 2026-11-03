import { Router } from 'express';
import { AuctionController } from './auction.controller.ts';
import { authenticateToken, requireAdmin } from '../../middleware/auth.middleware.ts';

const router = Router();

// All admin routes require valid token + ADMIN role
router.use(authenticateToken as any, requireAdmin as any);

// GET /api/v1/admin/metrics and /api/v1/admin/auctions/metrics (Admin dashboard metrics)
router.get('/metrics', AuctionController.getAdminMetrics as any);
router.get('/auctions/metrics', AuctionController.getAdminMetrics as any);

// GET /api/v1/admin/access-requests (All access requests across auctions)
router.get('/access-requests', AuctionController.listAllAdminRequests as any);

// GET /api/v1/admin/auctions/:id/access-requests (Access requests for specific auction)
router.get('/auctions/:id/access-requests', AuctionController.listRequestsForAuction as any);

// PATCH /api/v1/admin/access-requests/:requestId/approve
router.patch('/access-requests/:requestId/approve', AuctionController.approveRequest as any);

// PATCH /api/v1/admin/access-requests/:requestId/reject
router.patch('/access-requests/:requestId/reject', AuctionController.rejectRequest as any);

// DELETE /api/v1/admin/auctions/:id/participants/:userId (Revoke participant access)
router.delete('/auctions/:id/participants/:userId', AuctionController.revokeAccess as any);

export default router;
