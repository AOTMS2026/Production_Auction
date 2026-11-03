import { type Request, type Response } from 'express';
import { FormTemplateService } from './form-template.service.ts';
import { FormResolutionService } from './form-resolution.service.ts';
import { TeamFormConfigModel } from '../../models/TeamFormConfig.model.ts';

export class FormTemplateController {
  static async list(req: Request, res: Response) {
    try {
      const auctionId = req.params.auctionId as string;
      const templates = await FormTemplateService.listTemplates(auctionId);
      res.status(200).json({ success: true, count: templates.length, data: templates });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const auctionId = req.params.auctionId as string;
      const formId = req.params.formId as string;
      const template = await FormTemplateService.getTemplateById(auctionId, formId);
      res.status(200).json({ success: true, data: template });
    } catch (error: any) {
      res.status(404).json({ success: false, message: error.message });
    }
  }

  static async getOrCreate(req: Request, res: Response) {
    try {
      const auctionId = req.params.auctionId as string;
      const formType = (req.query.formType as any) || 'TEAM_REGISTRATION';
      const userId = (req as any).user?.id || 'system';
      const template = await FormTemplateService.getOrCreateTemplate(auctionId, formType, userId);
      res.status(200).json({ success: true, data: template });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async updateDraft(req: Request, res: Response) {
    try {
      const auctionId = req.params.auctionId as string;
      const formId = req.params.formId as string;
      const updated = await FormTemplateService.updateDraft(auctionId, formId, req.body);
      res.status(200).json({ success: true, message: 'Draft saved successfully.', data: updated });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async publish(req: Request, res: Response) {
    try {
      const auctionId = req.params.auctionId as string;
      const formId = req.params.formId as string;
      const userId = (req as any).user?.id;
      const published = await FormTemplateService.publishTemplate(auctionId, formId, userId);
      res.status(200).json({
        success: true,
        message: `Template published successfully as version ${published.version}.`,
        data: published,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async listVersions(req: Request, res: Response) {
    try {
      const auctionId = req.params.auctionId as string;
      const formId = req.params.formId as string;
      const versions = await FormTemplateService.listVersions(auctionId, formId);
      res.status(200).json({ success: true, count: versions.length, data: versions });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async rollback(req: Request, res: Response) {
    try {
      const auctionId = req.params.auctionId as string;
      const formId = req.params.formId as string;
      const versionId = req.params.versionId as string;
      const userId = (req as any).user?.id;
      const rolledBack = await FormTemplateService.rollbackTemplate(
        auctionId,
        formId,
        Number(versionId),
        userId
      );
      res.status(200).json({
        success: true,
        message: `Form successfully rolled back to version ${versionId} as new active version ${rolledBack.version}.`,
        data: rolledBack,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getEffective(req: Request, res: Response) {
    try {
      const auctionId = req.params.auctionId as string;
      const formType = (req.query.formType as any) || 'TEAM_REGISTRATION';
      const teamId = req.query.teamId as string | undefined;
      const effective = await FormResolutionService.resolveEffectiveForm(auctionId, formType, teamId);
      res.status(200).json({ success: true, data: effective });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getTeamFormConfig(req: Request, res: Response) {
    try {
      const auctionId = req.params.auctionId as string;
      const teamId = req.params.teamId as string;
      const config = await TeamFormConfigModel.findOne({ auctionId, teamId });
      res.status(200).json({ success: true, data: config || { overrides: {} } });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async saveTeamFormConfig(req: Request, res: Response) {
    try {
      const auctionId = req.params.auctionId as string;
      const teamId = req.params.teamId as string;
      const userId = (req as any).user?.id;
      const { overrides, formTemplateId } = req.body;

      const updated = await TeamFormConfigModel.findOneAndUpdate(
        { auctionId, teamId },
        {
          auctionId,
          teamId,
          formTemplateId,
          overrides: overrides || {},
          createdBy: userId,
        },
        { upsert: true, new: true }
      );
      res.status(200).json({ success: true, message: 'Team form config saved.', data: updated });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}
