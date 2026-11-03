import mongoose, { Document, Schema } from 'mongoose';

export type SubmissionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface IFormSubmission extends Document {
  auctionId: mongoose.Types.ObjectId;
  formTemplateId: mongoose.Types.ObjectId;
  formVersion: number;
  formType: 'TEAM_REGISTRATION' | 'PLAYER_REGISTRATION';
  teamId?: mongoose.Types.ObjectId;
  submittedBy?: mongoose.Types.ObjectId;
  data: Record<string, any>;
  status: SubmissionStatus;
  adminNote?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const FormSubmissionSchema = new Schema<IFormSubmission>(
  {
    auctionId: {
      type: Schema.Types.ObjectId,
      ref: 'Auction',
      required: true,
      index: true,
    },
    formTemplateId: {
      type: Schema.Types.ObjectId,
      ref: 'FormTemplate',
      required: true,
      index: true,
    },
    formVersion: {
      type: Number,
      required: true,
    },
    formType: {
      type: String,
      enum: ['TEAM_REGISTRATION', 'PLAYER_REGISTRATION'],
      required: true,
      index: true,
    },
    teamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
      index: true,
    },
    submittedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    data: {
      type: Schema.Types.Mixed,
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
      index: true,
    },
    adminNote: {
      type: String,
      default: '',
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

FormSubmissionSchema.index({ auctionId: 1, formType: 1, status: 1 });

export const FormSubmissionModel = mongoose.model<IFormSubmission>(
  'FormSubmission',
  FormSubmissionSchema
);
