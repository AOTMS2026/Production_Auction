import { Router } from 'express';
import { FormSubmissionController } from './form-submission.controller.ts';
import { authenticateToken, optionalAuth, requireAdmin } from '../../middleware/auth.middleware.ts';

const router = Router({ mergeParams: true });

// Form submission endpoint (can be submitted by user or visitor)
router.post('/', optionalAuth as any, FormSubmissionController.submit as any);

// Admin submission management
router.get('/', authenticateToken as any, requireAdmin as any, FormSubmissionController.list as any);
router.patch(
  '/:submissionId/status',
  authenticateToken as any,
  requireAdmin as any,
  FormSubmissionController.updateStatus as any
);

export default router;
