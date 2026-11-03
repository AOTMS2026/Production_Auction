import { Router } from 'express';
import { PlayerController } from './player.controller.ts';
import { authenticateToken, requireAdmin } from '../../middleware/auth.middleware.ts';

const router = Router({ mergeParams: true });

// Public/User view of registered players
router.get('/', PlayerController.list as any);
router.get('/:playerId', PlayerController.getById as any);

// Player registration & management
router.post('/', authenticateToken as any, PlayerController.create as any);
router.patch('/:playerId', authenticateToken as any, requireAdmin as any, PlayerController.update as any);
router.delete('/:playerId', authenticateToken as any, requireAdmin as any, PlayerController.delete as any);

export default router;
