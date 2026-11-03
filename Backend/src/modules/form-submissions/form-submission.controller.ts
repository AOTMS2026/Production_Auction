import { type Request, type Response } from 'express';
import { FormSubmissionService } from './form-submission.service.ts';

export class FormSubmissionController {
  static async submit(req: Request, res: Response) {
    try {
      const { auctionId } = req.params;
      const { formType, data, teamId } = req.body;
      const submittedBy = (req as any).user?.id;

      const submission = await FormSubmissionService.submitForm(
        String(auctionId),
        formType || 'PLAYER_REGISTRATION',
        data || req.body,
        submittedBy,
        teamId
      );

      const submissionObj = submission.toObject ? submission.toObject() : submission;
      if ((submission as any)._doc?.createdPlayer) {
        submissionObj.createdPlayer = (submission as any)._doc.createdPlayer;
      }

      res.status(201).json({
        success: true,
        message: 'Registration form submitted successfully.',
        data: submissionObj,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Submission failed.',
        code: error.code || 'FORM_SUBMISSION_ERROR',
        errors: error.errors || [],
      });
    }
  }

  static async list(req: Request, res: Response) {
    try {
      const { auctionId } = req.params;
      const { formType, status } = req.query;
      const submissions = await FormSubmissionService.listSubmissions(
        String(auctionId),
        formType as string,
        status as string
      );
      res.status(200).json({ success: true, count: submissions.length, data: submissions });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async updateStatus(req: Request, res: Response) {
    try {
      const { auctionId, submissionId } = req.params;
      const { status, adminNote } = req.body;
      const reviewedBy = (req as any).user?.id;

      const updated = await FormSubmissionService.updateStatus(
        String(auctionId),
        String(submissionId),
        status,
        adminNote,
        reviewedBy
      );

      res.status(200).json({
        success: true,
        message: `Submission status updated to ${status}.`,
        data: updated,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}
