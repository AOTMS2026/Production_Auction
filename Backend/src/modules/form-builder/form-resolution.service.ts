import { FormTemplateModel, type IFormField } from '../../models/FormTemplate.model.ts';
import { TeamFormConfigModel } from '../../models/TeamFormConfig.model.ts';
import { FormTemplateService } from './form-template.service.ts';

export class FormResolutionService {
  /**
   * Resolves the effective form configuration by merging the auction template with team overrides.
   */
  static async resolveEffectiveForm(
    auctionId: string,
    formType: 'TEAM_REGISTRATION' | 'PLAYER_REGISTRATION',
    teamId?: string,
    userId?: string
  ): Promise<{ templateId: string; version: number; fields: IFormField[] }> {
    // 1. Get published or latest template
    let template: any = await FormTemplateModel.findOne({
      auctionId,
      formType,
      status: 'PUBLISHED',
    }).sort({ version: -1 });

    if (!template) {
      template = await FormTemplateService.getOrCreateTemplate(
        auctionId,
        formType,
        userId || 'system'
      );
    }

    // 2. Clone template fields
    const effectiveFields: IFormField[] = JSON.parse(JSON.stringify(template.fields));

    // 3. If a teamId is specified, apply team-specific overrides
    if (teamId) {
      const teamConfig = await TeamFormConfigModel.findOne({ auctionId, teamId });
      if (teamConfig && teamConfig.overrides) {
        for (const field of effectiveFields) {
          const override = teamConfig.overrides[field.key];
          if (override) {
            if (override.visible !== undefined) field.visible = override.visible;
            if (override.required !== undefined) field.required = override.required;
            if (override.editable !== undefined) field.editable = override.editable;
            if (override.options !== undefined) field.options = override.options;
          }
        }
      }
    }

    return {
      templateId: template._id.toString(),
      version: template.version,
      fields: effectiveFields.sort((a, b) => a.order - b.order),
    };
  }
}
