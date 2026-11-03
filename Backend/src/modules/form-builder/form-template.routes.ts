import { Router } from 'express';
import { FormTemplateController } from './form-template.controller.ts';
import { authenticateToken, requireAdmin } from '../../middleware/auth.middleware.ts';

const router = Router({ mergeParams: true });

// Effective public/user resolved form for registration
router.get('/effective', FormTemplateController.getEffective as any);

// Players.md requirement: GET /api/v1/auctions/:auctionId/forms/player
router.get('/player', (req, res, next) => {
  (req.query as any).formType = 'PLAYER_REGISTRATION';
  FormTemplateController.getEffective(req, res);
});

// Team-specific form configuration
router.get('/teams/:teamId/form-config', FormTemplateController.getTeamFormConfig as any);
router.put(
  '/teams/:teamId/form-config',
  authenticateToken as any,
  requireAdmin as any,
  FormTemplateController.saveTeamFormConfig as any
);

// Admin Form Builder APIs
router.get('/', authenticateToken as any, requireAdmin as any, FormTemplateController.list as any);
router.get(
  '/current',
  authenticateToken as any,
  requireAdmin as any,
  FormTemplateController.getOrCreate as any
);
router.get('/:formId', authenticateToken as any, requireAdmin as any, FormTemplateController.getById as any);
router.patch('/:formId', authenticateToken as any, requireAdmin as any, FormTemplateController.updateDraft as any);
router.post(
  '/:formId/publish',
  authenticateToken as any,
  requireAdmin as any,
  FormTemplateController.publish as any
);
router.get(
  '/:formId/versions',
  authenticateToken as any,
  requireAdmin as any,
  FormTemplateController.listVersions as any
);
router.post(
  '/:formId/rollback/:versionId',
  authenticateToken as any,
  requireAdmin as any,
  FormTemplateController.rollback as any
);

export default router;
