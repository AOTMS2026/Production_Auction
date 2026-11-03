import { Router } from 'express';
import { TeamController } from './team.controller.ts';
import { authenticateToken, requireAdmin } from '../../middleware/auth.middleware.ts';

const router = Router({ mergeParams: true });

// Public/User view of teams
router.get('/', TeamController.list as any);
router.get('/:teamId', TeamController.getById as any);

// Admin team management
router.post('/', authenticateToken as any, requireAdmin as any, TeamController.create as any);
router.patch('/:teamId', authenticateToken as any, requireAdmin as any, TeamController.update as any);
router.delete('/:teamId', authenticateToken as any, requireAdmin as any, TeamController.delete as any);

export default router;
