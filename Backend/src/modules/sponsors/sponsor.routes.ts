import { Router } from 'express';
import { SponsorController } from './sponsor.controller.ts';
import { authenticateToken, requireAdmin } from '../../middleware/auth.middleware.ts';

const router = Router({ mergeParams: true });

router.get('/', SponsorController.list as any);
router.post('/', authenticateToken as any, requireAdmin as any, SponsorController.create as any);
router.patch('/:sponsorId', authenticateToken as any, requireAdmin as any, SponsorController.update as any);
router.delete('/:sponsorId', authenticateToken as any, requireAdmin as any, SponsorController.delete as any);

export default router;
