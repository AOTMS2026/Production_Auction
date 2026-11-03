import mongoose, { Document, Schema } from 'mongoose';

export interface IFieldOverride {
  visible?: boolean;
  required?: boolean;
  editable?: boolean;
  options?: Array<{ label: string; value: string }>;
}

export interface ITeamFormConfig extends Document {
  auctionId: mongoose.Types.ObjectId;
  teamId: mongoose.Types.ObjectId;
  formTemplateId: mongoose.Types.ObjectId;
  overrides: Record<string, IFieldOverride>;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TeamFormConfigSchema = new Schema<ITeamFormConfig>(
  {
    auctionId: {
      type: Schema.Types.ObjectId,
      ref: 'Auction',
      required: true,
      index: true,
    },
    teamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
      index: true,
    },
    formTemplateId: {
      type: Schema.Types.ObjectId,
      ref: 'FormTemplate',
      required: true,
    },
    overrides: {
      type: Schema.Types.Mixed,
      default: {},
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

TeamFormConfigSchema.index({ auctionId: 1, teamId: 1 }, { unique: true });

export const TeamFormConfigModel = mongoose.model<ITeamFormConfig>(
  'TeamFormConfig',
  TeamFormConfigSchema
);
