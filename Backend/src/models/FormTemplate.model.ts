import mongoose, { Document, Schema } from 'mongoose';

export type FormType = 'TEAM_REGISTRATION' | 'PLAYER_REGISTRATION';
export type FormTemplateStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface IFormField {
  key: string;
  label: string;
  type: string; // text, textarea, number, email, phone, date, select, radio, checkbox, multiselect, file, image, paymentMode, section, description, consent
  required: boolean;
  visible: boolean;
  editable: boolean;
  placeholder?: string;
  description?: string;
  defaultValue?: any;
  options?: Array<{ label: string; value: string }>;
  validation?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
    allowedCharacters?: 'PERSON_NAME' | 'ALPHANUMERIC' | 'ANY' | string;
    digitsOnly?: boolean;
    integerOnly?: boolean;
    positiveOnly?: boolean;
    countryCode?: string;
    minDate?: string;
    maxDate?: string;
    allowedFileTypes?: string[];
    maxFileSizeMb?: number;
    imageSettings?: {
      allowedFormats?: string[];
      maxFileSizeMB?: number;
      minWidth?: number;
      minHeight?: number;
      maxWidth?: number;
      maxHeight?: number;
      aspectRatio?: string;
      previewEnabled?: boolean;
      zoomEnabled?: boolean;
      cropEnabled?: boolean;
    };
    messages?: {
      required?: string;
      invalid?: string;
    };
  };
  conditionalRule?: {
    dependOnFieldKey: string;
    operator: 'equals' | 'notEquals' | 'contains' | 'in';
    value: any;
    action: 'show' | 'hide' | 'require';
  };
  order: number;
  colSpan?: number;
}

export interface IFormTemplate extends Document {
  auctionId: mongoose.Types.ObjectId;
  formType: FormType;
  name: string;
  version: number;
  status: FormTemplateStatus;
  scope?: 'AUCTION' | 'TEAM';
  teamId?: mongoose.Types.ObjectId | null;
  fields: IFormField[];
  createdBy: mongoose.Types.ObjectId;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const FormFieldSchema = new Schema<IFormField>(
  {
    key: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    type: { type: String, required: true },
    required: { type: Boolean, default: false },
    visible: { type: Boolean, default: true },
    editable: { type: Boolean, default: true },
    placeholder: { type: String, default: '' },
    description: { type: String, default: '' },
    defaultValue: { type: Schema.Types.Mixed, default: null },
    options: [
      {
        label: { type: String, required: true },
        value: { type: String, required: true },
      },
    ],
    validation: {
      minLength: { type: Number },
      maxLength: { type: Number },
      min: { type: Number },
      max: { type: Number },
      pattern: { type: String },
      allowedCharacters: { type: String },
      digitsOnly: { type: Boolean },
      integerOnly: { type: Boolean },
      positiveOnly: { type: Boolean },
      countryCode: { type: String },
      minDate: { type: String },
      maxDate: { type: String },
      allowedFileTypes: [{ type: String }],
      maxFileSizeMb: { type: Number },
      imageSettings: {
        allowedFormats: [{ type: String }],
        maxFileSizeMB: { type: Number },
        minWidth: { type: Number },
        minHeight: { type: Number },
        maxWidth: { type: Number },
        maxHeight: { type: Number },
        aspectRatio: { type: String },
        previewEnabled: { type: Boolean, default: true },
        zoomEnabled: { type: Boolean, default: true },
        cropEnabled: { type: Boolean, default: false },
      },
      messages: {
        required: { type: String },
        invalid: { type: String },
      },
    },
    conditionalRule: {
      dependOnFieldKey: { type: String },
      operator: { type: String, enum: ['equals', 'notEquals', 'contains', 'in'] },
      value: { type: Schema.Types.Mixed },
      action: { type: String, enum: ['show', 'hide', 'require'] },
    },
    order: { type: Number, required: true, default: 0 },
    colSpan: { type: Number, enum: [1, 2], default: 1 },
  },
  { _id: false }
);

const FormTemplateSchema = new Schema<IFormTemplate>(
  {
    auctionId: {
      type: Schema.Types.ObjectId,
      ref: 'Auction',
      required: true,
      index: true,
    },
    formType: {
      type: String,
      enum: ['TEAM_REGISTRATION', 'PLAYER_REGISTRATION'],
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    version: {
      type: Number,
      required: true,
      default: 1,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
      default: 'DRAFT',
    },
    scope: {
      type: String,
      enum: ['AUCTION', 'TEAM'],
      default: 'AUCTION',
    },
    teamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
    },
    fields: {
      type: [FormFieldSchema],
      default: [],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

FormTemplateSchema.index({ auctionId: 1, formType: 1, version: 1 }, { unique: true });

export const FormTemplateModel = mongoose.model<IFormTemplate>(
  'FormTemplate',
  FormTemplateSchema
);
