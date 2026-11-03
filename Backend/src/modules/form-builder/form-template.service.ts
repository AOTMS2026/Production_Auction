import mongoose from 'mongoose';
import {
  FormTemplateModel,
  type IFormTemplate,
  type IFormField,
  type FormType,
} from '../../models/FormTemplate.model.ts';
import { AuctionModel } from '../../models/Auction.model.ts';
import { FormValidationService } from './form-validation.service.ts';

export class FormTemplateService {
  /**
   * Generates default starter fields for team or player registration based on sport.
   */
  static getDefaultFields(formType: FormType, sport: string = 'CRICKET'): IFormField[] {
    if (formType === 'TEAM_REGISTRATION') {
      return [
        {
          key: 'teamLogo',
          label: 'Team Crest / Official Logo',
          type: 'image',
          required: false,
          visible: true,
          editable: true,
          description: 'Upload high-resolution team crest (Max 5MB)',
          defaultValue: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=200',
          order: 1,
          colSpan: 2,
        },
        {
          key: 'teamName',
          label: 'Team Name',
          type: 'text',
          required: true,
          visible: true,
          editable: true,
          placeholder: 'e.g. Mumbai Strikers',
          order: 2,
          colSpan: 1,
          validation: { minLength: 2, maxLength: 80 },
        },
        {
          key: 'teamCode',
          label: 'Team Code (Short Tag)',
          type: 'text',
          required: true,
          visible: true,
          editable: true,
          placeholder: 'e.g. MS',
          order: 3,
          colSpan: 1,
          validation: { minLength: 2, maxLength: 5 },
        },
        {
          key: 'ownerName',
          label: 'Franchise Owner / Manager Name',
          type: 'text',
          required: true,
          visible: true,
          editable: true,
          placeholder: 'Full legal name',
          order: 4,
          colSpan: 1,
        },
        {
          key: 'contactEmail',
          label: 'Official Contact Email',
          type: 'email',
          required: true,
          visible: true,
          editable: true,
          placeholder: 'team@domain.com',
          order: 5,
          colSpan: 1,
        },
        {
          key: 'contactPhone',
          label: 'Contact Phone Number',
          type: 'phone',
          required: true,
          visible: true,
          editable: true,
          placeholder: '+91 98765 43210',
          order: 6,
          colSpan: 1,
        },
        {
          key: 'paymentMode',
          label: 'Team Registration Payment Mode',
          type: 'paymentMode',
          required: false,
          visible: false, // Default hidden, enabled via team/auction override
          editable: true,
          options: [
            { label: 'UPI Instant Transfer', value: 'UPI' },
            { label: 'Direct Bank Wire (RTGS/NEFT)', value: 'BANK_TRANSFER' },
            { label: 'Official Cash Receipt', value: 'CASH' },
          ],
          order: 7,
          colSpan: 1,
        },
        {
          key: 'paymentUpload',
          label: 'Payment Receipt / UTR Proof',
          type: 'file',
          required: false,
          visible: false, // Default hidden, enabled via team/auction override
          editable: true,
          description: 'Upload transaction receipt screenshot or bank statement (Max 5MB)',
          validation: { allowedFileTypes: ['pdf', 'png', 'jpg', 'jpeg'], maxFileSizeMb: 5 },
          conditionalRule: {
            dependOnFieldKey: 'paymentMode',
            operator: 'notEquals',
            value: '',
            action: 'show',
          },
          order: 8,
          colSpan: 2,
        },
        {
          key: 'termsConsent',
          label: 'I accept league regulations & team purse rules',
          type: 'consent',
          required: true,
          visible: true,
          editable: true,
          order: 9,
          colSpan: 2,
        },
      ];
    }

    // Default PLAYER_REGISTRATION fields
    const sportFields: Record<string, IFormField[]> = {
      CRICKET: [
        {
          key: 'role',
          label: 'Primary Playing Role',
          type: 'select',
          required: true,
          visible: true,
          editable: true,
          options: [
            { label: 'Top-Order Batsman', value: 'Batsman' },
            { label: 'Fast Bowler', value: 'Fast Bowler' },
            { label: 'Spin Bowler', value: 'Spin Bowler' },
            { label: 'All-Rounder', value: 'All-Rounder' },
            { label: 'Wicket-Keeper Batsman', value: 'Wicket-Keeper' },
          ],
          order: 4,
        },
        {
          key: 'battingStyle',
          label: 'Batting Style',
          type: 'radio',
          required: true,
          visible: true,
          editable: true,
          options: [
            { label: 'Right Hand Bat', value: 'Right Hand' },
            { label: 'Left Hand Bat', value: 'Left Hand' },
          ],
          order: 5,
        },
        {
          key: 'bowlingStyle',
          label: 'Bowling Style',
          type: 'select',
          required: false,
          visible: true,
          editable: true,
          options: [
            { label: 'Right-arm Fast', value: 'Right Fast' },
            { label: 'Left-arm Fast', value: 'Left Fast' },
            { label: 'Right-arm Off-Spin', value: 'Right Off-Spin' },
            { label: 'Right-arm Leg-Spin', value: 'Right Leg-Spin' },
            { label: 'Slow Left-arm Orthodox', value: 'Left Orthodox' },
            { label: 'None', value: 'None' },
          ],
          order: 6,
        },
      ],
      FOOTBALL: [
        {
          key: 'role',
          label: 'Field Position',
          type: 'select',
          required: true,
          visible: true,
          editable: true,
          options: [
            { label: 'Striker / Forward', value: 'Forward' },
            { label: 'Midfielder', value: 'Midfielder' },
            { label: 'Center Back / Defender', value: 'Defender' },
            { label: 'Goalkeeper', value: 'Goalkeeper' },
            { label: 'Winger', value: 'Winger' },
          ],
          order: 4,
        },
        {
          key: 'preferredFoot',
          label: 'Preferred Foot',
          type: 'radio',
          required: true,
          visible: true,
          editable: true,
          options: [
            { label: 'Right Foot', value: 'Right' },
            { label: 'Left Foot', value: 'Left' },
            { label: 'Both / Ambidextrous', value: 'Both' },
          ],
          order: 5,
        },
      ],
      VOLLEYBALL: [
        {
          key: 'role',
          label: 'Court Position',
          type: 'select',
          required: true,
          visible: true,
          editable: true,
          options: [
            { label: 'Outside Hitter', value: 'Outside Hitter' },
            { label: 'Setter', value: 'Setter' },
            { label: 'Middle Blocker', value: 'Middle Blocker' },
            { label: 'Libero / Defensive Specialist', value: 'Libero' },
            { label: 'Opposite Hitter', value: 'Opposite Hitter' },
          ],
          order: 4,
        },
      ],
      KABADDI: [
        {
          key: 'role',
          label: 'Playing Role',
          type: 'select',
          required: true,
          visible: true,
          editable: true,
          options: [
            { label: 'Raider', value: 'Raider' },
            { label: 'Left Corner Defender', value: 'Left Corner' },
            { label: 'Right Corner Defender', value: 'Right Corner' },
            { label: 'Left Cover Defender', value: 'Left Cover' },
            { label: 'Right Cover Defender', value: 'Right Cover' },
            { label: 'All-Rounder', value: 'All-Rounder' },
          ],
          order: 4,
        },
      ],
      BADMINTON: [
        {
          key: 'role',
          label: 'Competition Category',
          type: 'select',
          required: true,
          visible: true,
          editable: true,
          options: [
            { label: "Men's Singles", value: 'MS' },
            { label: "Women's Singles", value: 'WS' },
            { label: "Men's Doubles", value: 'MD' },
            { label: "Women's Doubles", value: 'WD' },
            { label: 'Mixed Doubles', value: 'XD' },
          ],
          order: 4,
        },
      ],
    };

    const specificFields = sportFields[sport] || sportFields.CRICKET;

    return [
      {
        key: 'profileImage',
        label: 'Player Headshot / Passport Photo',
        type: 'image',
        required: true,
        visible: true,
        editable: true,
        description: 'Upload high-resolution photo for auction card (Max 5MB)',
        order: 1,
        colSpan: 2,
      },
      {
        key: 'playerName',
        label: 'Player Full Name',
        type: 'text',
        required: true,
        visible: true,
        editable: true,
        placeholder: 'Legal full name',
        order: 2,
        colSpan: 1,
        validation: { minLength: 2, maxLength: 80 },
      },
      {
        key: 'playerEmail',
        label: 'Player Email Address',
        type: 'email',
        required: true,
        visible: true,
        editable: true,
        placeholder: 'player@domain.com',
        order: 3,
        colSpan: 1,
      },
      {
        key: 'playerPhone',
        label: 'Contact / WhatsApp Number',
        type: 'phone',
        required: true,
        visible: true,
        editable: true,
        placeholder: '+91 98765 43210',
        order: 4,
        colSpan: 1,
      },
      ...specificFields,
      {
        key: 'experience',
        label: 'Competitive Experience',
        type: 'select',
        required: true,
        visible: true,
        editable: true,
        options: [
          { label: 'Grassroots / District Level', value: 'District' },
          { label: 'State / University Level', value: 'State' },
          { label: 'National / Professional League', value: 'National' },
          { label: 'International Representative', value: 'International' },
        ],
        order: 8,
        colSpan: 1,
      },
      {
        key: 'basePrice',
        label: 'Player Base Price (Starting Gavel Point)',
        type: 'number',
        required: true,
        visible: true,
        editable: true,
        placeholder: 'e.g. 10000',
        order: 9,
        colSpan: 1,
      },
      {
        key: 'idProofUpload',
        label: 'Government ID / Sports Federation Card',
        type: 'file',
        required: false,
        visible: true,
        editable: true,
        description: 'Identity verification proof (Aadhaar, Passport, National ID)',
        order: 10,
        colSpan: 2,
      },
      {
        key: 'consentDeclaration',
        label: 'I confirm medical fitness and authorize league auction rules',
        type: 'consent',
        required: true,
        visible: true,
        editable: true,
        order: 11,
        colSpan: 2,
      },
    ];
  }

  /**
   * Retrieves or provisions the initial default form template for an auction.
   */
  static async getOrCreateTemplate(
    auctionId: string,
    formType: FormType,
    userId: string
  ): Promise<IFormTemplate> {
    let template = await FormTemplateModel.findOne({
      auctionId,
      formType,
    }).sort({ version: -1 });

    if (!template) {
      const auction = await AuctionModel.findById(auctionId);
      const sport = auction?.sport || 'CRICKET';
      const fields = this.getDefaultFields(formType, sport);

      const creatorId = mongoose.Types.ObjectId.isValid(userId) ? userId : auction?.ownerId || null;

      template = new FormTemplateModel({
        auctionId,
        formType,
        name: formType === 'TEAM_REGISTRATION' ? 'Team Registration Form' : 'Player Registration Form',
        version: 1,
        status: 'PUBLISHED',
        fields,
        createdBy: creatorId,
        publishedAt: new Date(),
      });
      await template.save();
    }

    return template;
  }

  static async listTemplates(auctionId: string) {
    return FormTemplateModel.find({ auctionId }).sort({ formType: 1, version: -1 });
  }

  static async getTemplateById(auctionId: string, formId: string) {
    const template = await FormTemplateModel.findOne({ _id: formId, auctionId });
    if (!template) throw new Error('Form template not found.');
    return template;
  }

  static async updateDraft(auctionId: string, formId: string, payload: Partial<IFormTemplate>) {
    const template = await FormTemplateModel.findOne({ _id: formId, auctionId });
    if (!template) throw new Error('Form template not found.');

    if (payload.name) template.name = payload.name;
    if (payload.fields) {
      // Validate field definitions
      const valRes = FormValidationService.validateTemplateDefinition(payload.fields);
      if (!valRes.valid) {
        throw new Error(`Invalid draft configuration: ${valRes.errors.join(' ')}`);
      }
      template.fields = payload.fields;
    }
    template.status = 'DRAFT';

    await template.save();
    return template;
  }

  static async publishTemplate(auctionId: string, formId: string, userId: string) {
    const current = await FormTemplateModel.findOne({ _id: formId, auctionId });
    if (!current) throw new Error('Form template not found.');

    // 1. Validate complete template definition before publishing
    const validation = FormValidationService.validateTemplateDefinition(current.fields);
    if (!validation.valid) {
      throw new Error(`Cannot publish invalid form schema: ${validation.errors.join(' ')}`);
    }

    // 2. Find highest existing version to calculate next immutable version number
    const highest = await FormTemplateModel.findOne({
      auctionId,
      formType: current.formType,
    }).sort({ version: -1 });

    const nextVersion = highest ? highest.version + 1 : 1;

    // 3. Create new published immutable version
    const newVersionDoc = new FormTemplateModel({
      auctionId,
      formType: current.formType,
      name: current.name,
      version: nextVersion,
      status: 'PUBLISHED',
      fields: current.fields,
      createdBy: userId,
      publishedAt: new Date(),
    });

    await newVersionDoc.save();

    // 4. Archive old versions to keep active published pointer clean
    await FormTemplateModel.updateMany(
      {
        auctionId,
        formType: current.formType,
        _id: { $ne: newVersionDoc._id },
        status: 'PUBLISHED',
      },
      { $set: { status: 'ARCHIVED' } }
    );

    return newVersionDoc;
  }

  static async rollbackTemplate(auctionId: string, formId: string, targetVersion: number, userId: string) {
    const current = await FormTemplateModel.findOne({ _id: formId, auctionId });
    if (!current) throw new Error('Form template not found.');

    const target = await FormTemplateModel.findOne({
      auctionId,
      formType: current.formType,
      version: targetVersion,
    });
    if (!target) throw new Error(`Version ${targetVersion} not found.`);

    // As per specification: Rollback must republish a prior definition as a new active version
    const highest = await FormTemplateModel.findOne({
      auctionId,
      formType: current.formType,
    }).sort({ version: -1 });

    const nextVersion = (highest?.version || 1) + 1;

    const rollbackDoc = new FormTemplateModel({
      auctionId,
      formType: current.formType,
      name: `${target.name} (Rollback to v${targetVersion})`,
      version: nextVersion,
      status: 'PUBLISHED',
      fields: target.fields,
      createdBy: userId,
      publishedAt: new Date(),
    });

    await rollbackDoc.save();

    // Archive previous
    await FormTemplateModel.updateMany(
      {
        auctionId,
        formType: current.formType,
        _id: { $ne: rollbackDoc._id },
        status: 'PUBLISHED',
      },
      { $set: { status: 'ARCHIVED' } }
    );

    return rollbackDoc;
  }

  static async listVersions(auctionId: string, formId: string) {
    const current = await FormTemplateModel.findOne({ _id: formId, auctionId });
    if (!current) throw new Error('Form template not found.');

    return FormTemplateModel.find({
      auctionId,
      formType: current.formType,
    })
      .select('version status name publishedAt createdAt fields')
      .sort({ version: -1 });
  }
}
