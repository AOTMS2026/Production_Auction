import { FormSubmissionModel, type IFormSubmission } from '../../models/FormSubmission.model.ts';
import { FormResolutionService } from '../form-builder/form-resolution.service.ts';
import { FormValidationService } from '../form-builder/form-validation.service.ts';
import { PlayerModel } from '../../models/Player.model.ts';
import { TeamModel } from '../../models/Team.model.ts';

export class FormSubmissionService {
  static async submitForm(
    auctionId: string,
    formType: 'TEAM_REGISTRATION' | 'PLAYER_REGISTRATION',
    data: Record<string, any>,
    submittedBy?: string,
    teamId?: string
  ) {
    // 1. Resolve effective form schema
    const effective = await FormResolutionService.resolveEffectiveForm(
      auctionId,
      formType,
      teamId,
      submittedBy
    );

    // 2. Validate payload against dynamic schema
    const validation = FormValidationService.validateSubmission(effective.fields, data);
    if (!validation.valid) {
      const err: any = new Error('Please correct the highlighted fields');
      err.code = 'FORM_VALIDATION_FAILED';
      err.errors = validation.errors;
      throw err;
    }

    // 3. Save Form Submission document
    const submission = new FormSubmissionModel({
      auctionId,
      formTemplateId: effective.templateId,
      formVersion: effective.version,
      formType,
      teamId: teamId || null,
      submittedBy: submittedBy || null,
      data,
      status: 'PENDING',
      submittedAt: new Date(),
    });

    await submission.save();

    // 4. If Player Registration, also create/sync Player record
    let createdPlayerDoc: any = null;
    if (formType === 'PLAYER_REGISTRATION') {
      // Find field values dynamically from effective template definition or common keys
      let extractedName = data.playerName || data.name || '';
      let extractedEmail = data.playerEmail || data.email || '';
      let extractedPhone = data.playerPhone || data.phone || '';
      let extractedRole = data.role || data.playerRole || '';
      let extractedBasePrice = Number(data.basePrice) || 0;
      let extractedImage = data.profileImage || '';
      const matchedFieldKeys = new Set<string>();

      if (effective && Array.isArray(effective.fields)) {
        for (const f of effective.fields) {
          const val = data[f.key];
          if (val === undefined || val === null || val === '') continue;

          const keyLower = (f.key || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          const labelLower = (f.label || '').toLowerCase();

          // 1. Match Image
          if (
            !extractedImage &&
            (f.type === 'image' ||
              keyLower.includes('image') ||
              keyLower.includes('photo') ||
              labelLower.includes('photo') ||
              labelLower.includes('image') ||
              labelLower.includes('avatar') ||
              labelLower.includes('picture'))
          ) {
            extractedImage = String(val);
            matchedFieldKeys.add(f.key);
            continue;
          }

          // 2. Match Email
          if (
            !extractedEmail &&
            (f.type === 'email' ||
              keyLower.includes('email') ||
              labelLower.includes('email') ||
              (typeof val === 'string' && val.includes('@') && val.includes('.')))
          ) {
            extractedEmail = String(val).trim();
            matchedFieldKeys.add(f.key);
            continue;
          }

          // 3. Match Phone
          if (
            !extractedPhone &&
            (f.type === 'phone' ||
              f.validation?.digitsOnly ||
              keyLower.includes('phone') ||
              keyLower.includes('mobile') ||
              keyLower.includes('contact') ||
              labelLower.includes('phone') ||
              labelLower.includes('mobile') ||
              labelLower.includes('contact'))
          ) {
            extractedPhone = String(val).trim();
            matchedFieldKeys.add(f.key);
            continue;
          }

          // 4. Match Base Price
          if (
            !extractedBasePrice &&
            (keyLower.includes('baseprice') ||
              keyLower.includes('price') ||
              keyLower.includes('bid') ||
              labelLower.includes('base price') ||
              labelLower.includes('price') ||
              labelLower.includes('bid'))
          ) {
            const num = Number(val);
            if (!isNaN(num) && num > 0) {
              extractedBasePrice = num;
              matchedFieldKeys.add(f.key);
              continue;
            }
          }

          // 5. Match Role / Position
          if (
            !extractedRole &&
            (keyLower.includes('role') ||
              keyLower.includes('position') ||
              keyLower.includes('category') ||
              labelLower.includes('role') ||
              labelLower.includes('position') ||
              labelLower.includes('category'))
          ) {
            if (f.options && Array.isArray(f.options)) {
              const opt = f.options.find((o: any) => o.value === val);
              extractedRole = opt ? opt.label : String(val);
            } else {
              extractedRole = String(val);
            }
            matchedFieldKeys.add(f.key);
            continue;
          }

          // 6. Match Player Name
          if (
            !extractedName &&
            (f.type === 'text' || f.validation?.allowedCharacters === 'PERSON_NAME' || f.order === 1)
          ) {
            if (
              keyLower.includes('name') ||
              keyLower.includes('player') ||
              labelLower.includes('name') ||
              labelLower.includes('player')
            ) {
              extractedName = String(val).trim();
              matchedFieldKeys.add(f.key);
              continue;
            }
          }
        }
      }

      // If name or email still not found, check remaining data keys directly
      if (!extractedName) {
        for (const [k, v] of Object.entries(data)) {
          if (typeof v === 'string' && v.trim() && !v.startsWith('data:image') && !v.includes('@') && !matchedFieldKeys.has(k)) {
            const kLower = k.toLowerCase();
            if (kLower.includes('name') || kLower.includes('player')) {
              extractedName = v.trim();
              matchedFieldKeys.add(k);
              break;
            }
          }
        }
      }

      if (!extractedEmail) {
        for (const [k, v] of Object.entries(data)) {
          if (typeof v === 'string' && v.includes('@') && v.includes('.') && !matchedFieldKeys.has(k)) {
            extractedEmail = v.trim();
            matchedFieldKeys.add(k);
            break;
          }
        }
      }

      if (!extractedImage) {
        for (const [k, v] of Object.entries(data)) {
          if (typeof v === 'string' && (v.startsWith('data:image') || v.startsWith('http')) && !matchedFieldKeys.has(k)) {
            extractedImage = v;
            matchedFieldKeys.add(k);
            break;
          }
        }
      }

      const playerName = extractedName || data.playerName || data.name || 'New Player';
      const playerEmail = (
        extractedEmail ||
        data.playerEmail ||
        data.email ||
        `${(playerName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'player')}_${Date.now()}@auction.local`
      )
        .toLowerCase()
        .trim();
      const role = extractedRole || data.role || 'Player';
      const basePrice = extractedBasePrice || Number(data.basePrice) || 1000;
      const profileImage =
        extractedImage ||
        data.profileImage ||
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200';

      // Clean customFields: exclude large base64 strings and redundant top-level mapped fields
      const cleanCustomFields: Record<string, any> = {};
      const templateFieldMap = new Map<string, string>();
      if (effective && Array.isArray(effective.fields)) {
        for (const f of effective.fields) {
          if (f.key && f.label) templateFieldMap.set(f.key, f.label);
        }
      }

      for (const [k, v] of Object.entries(data)) {
        // Skip base64 image data inside customFields so Mongo doesn't store duplicate megabytes
        if (typeof v === 'string' && v.startsWith('data:image')) {
          continue;
        }
        // Skip system fields that are mapped directly to top-level
        if (['playerName', 'playerEmail', 'playerPhone', 'role', 'basePrice', 'sport', 'profileImage'].includes(k)) {
          continue;
        }
        // Use human-readable label and also preserve field key for displayLayout matching
        const readableKey = templateFieldMap.get(k) || k;
        cleanCustomFields[readableKey] = v;
        if (readableKey !== k) {
          cleanCustomFields[k] = v;
        }
      }

      createdPlayerDoc = await PlayerModel.findOneAndUpdate(
        { auctionId, email: playerEmail },
        {
          auctionId,
          teamId: teamId || null,
          name: playerName,
          email: playerEmail,
          phone: extractedPhone || data.playerPhone || data.phone || '',
          profileImage,
          sport: data.sport || 'CRICKET',
          role,
          basePrice,
          status: 'REGISTERED',
          customFields: cleanCustomFields,
          registrationFormVersion: effective.version,
          paymentMode: data.paymentMode || null,
          paymentReceiptUrl: data.paymentUpload || null,
          paymentVerified: false,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      (submission as any)._doc.createdPlayer = createdPlayerDoc;
    }

    // 5. If Team Registration, also create/sync Team record
    let createdTeamDoc: any = null;
    if (formType === 'TEAM_REGISTRATION') {
      const teamName = data.teamName || data.name || 'New Team';
      const teamCode = (data.teamCode || data.code || teamName.slice(0, 3)).toUpperCase();
      createdTeamDoc = await TeamModel.findOneAndUpdate(
        { auctionId, code: teamCode },
        {
          auctionId,
          name: teamName,
          code: teamCode,
          ownerName: data.ownerName || '',
          contactEmail: data.contactEmail || data.email || '',
          contactPhone: data.contactPhone || data.phone || '',
          purseTotal: Number(data.purseTotal) || 10000000,
          purseRemaining: Number(data.purseTotal) || 10000000,
          maxPlayers: Number(data.maxPlayers) || 15,
          logo: data.logo || data.teamLogo || 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=200',
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      (submission as any)._doc.createdTeam = createdTeamDoc;
    }

    const result = submission.toObject ? submission.toObject() : submission;
    if (createdPlayerDoc) (result as any).createdPlayer = createdPlayerDoc;
    if (createdTeamDoc) (result as any).createdTeam = createdTeamDoc;
    return result;
  }

  static async listSubmissions(auctionId: string, formType?: string, status?: string) {
    const query: any = { auctionId };
    if (formType) query.formType = formType;
    if (status) query.status = status;
    return FormSubmissionModel.find(query).sort({ submittedAt: -1 });
  }

  static async updateStatus(
    auctionId: string,
    submissionId: string,
    status: 'APPROVED' | 'REJECTED',
    adminNote?: string,
    reviewedBy?: string
  ) {
    const submission = await FormSubmissionModel.findOne({ _id: submissionId, auctionId });
    if (!submission) throw new Error('Submission not found.');

    submission.status = status;
    submission.adminNote = adminNote || '';
    submission.reviewedBy = reviewedBy as any;
    submission.reviewedAt = new Date();
    await submission.save();

    return submission;
  }
}
