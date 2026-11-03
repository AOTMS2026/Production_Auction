export type SportType = 'CRICKET' | 'VOLLEYBALL' | 'FOOTBALL' | 'KABADDI' | 'BADMINTON';
export type AuctionVisibility = 'PUBLIC' | 'PRIVATE';
export type AuctionStatus =
  | 'DRAFT'
  | 'PUBLISHED'
  | 'SCHEDULED'
  | 'LIVE'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'ARCHIVED';

export type AccessRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVOKED' | 'NONE';

export interface Auction {
  _id: string;
  name: string;
  slug: string;
  sport: SportType;
  image: {
    url: string;
    storageKey?: string;
  };
  scheduledAt: string;
  timezone: string;
  playersPerTeam: number;
  pointsBalancePerTeam: number;
  minimumBid: number;
  maximumBid: number;
  bidIncrement: number;
  visibility: AuctionVisibility;
  status: AuctionStatus;
  ownerId?: {
    _id: string;
    name: string;
    email: string;
    profileImage?: string;
  };
  currentBid: number;
  totalBids: number;
  userAccessStatus?: AccessRequestStatus;
  displayLayout?: {
    visibleFields?: string[];
    fieldOrder?: string[];
    themeColor?: 'cyan' | 'gold' | 'emerald' | 'crimson' | 'sapphire' | 'purple';
    cardLayout?: 'stadium' | 'broadcast' | 'modern';
    backgroundStyle?: 'stadium_floodlights' | 'cyber_grid' | 'dark_arena' | 'gradient';
    customTagline?: string;
    showSponsors?: boolean;
    showTeamPurses?: boolean;
    showBidTicker?: boolean;
    showSoundEffects?: boolean;
    updatedAt?: string;
    [key: string]: any;
  };
  createdAt?: string;
  updatedAt?: string;
}

// Backward compatibility with demo item
export interface AuctionItem {
  id?: string;
  _id?: string;
  name?: string;
  title?: string;
  description?: string;
  sport?: SportType;
  currentBid: number;
  startingBid?: number;
  totalBids: number;
  endsAt?: string;
  scheduledAt?: string;
  category?: string;
  imageUrl?: string;
  image?: { url: string };
  visibility?: AuctionVisibility;
  status: string;
}

export interface AccessRequest {
  _id: string;
  auctionId: {
    _id: string;
    name: string;
    sport: SportType;
    visibility: AuctionVisibility;
    status: AuctionStatus;
    scheduledAt: string;
  } | string;
  userId: {
    _id: string;
    name: string;
    email: string;
    profileImage?: string;
    role?: string;
  };
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVOKED';
  requestedAt: string;
  reviewedAt?: string;
  decisionNote?: string;
}

export interface AdminMetrics {
  total: number;
  drafts: number;
  published: number;
  scheduled: number;
  live: number;
  completed: number;
  pendingRequests: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Team {
  _id: string;
  auctionId: string;
  name: string;
  code: string;
  shortName?: string;
  logo: string;
  ownerName?: string;
  contactEmail?: string;
  contactPhone?: string;
  purseTotal: number;
  purseRemaining: number;
  playersCount: number;
  maxPlayers: number;
  // Derived / Calculated Stats
  registeredPlayersCount?: number;
  resPl?: number;
  usedPoints?: number;
  usedPts?: number;
  remainingPoints?: number;
  maxBid?: number;
  totalPoints?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Player {
  _id: string;
  auctionId: string;
  teamId?: {
    _id: string;
    name: string;
    code: string;
    logo: string;
  } | string | null;
  name: string;
  playerCode?: string;
  email: string;
  phone: string;
  profileImage: string;
  sport: string;
  role: string;
  experience?: string;
  basePrice: number;
  soldPrice?: number | null;
  status: 'REGISTERED' | 'APPROVED' | 'SOLD' | 'UNSOLD';
  customFields?: Record<string, any>;
  registrationFormVersion?: number;
  paymentMode?: string;
  paymentReceiptUrl?: string;
  paymentVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface FormField {
  key: string;
  label: string;
  type: string;
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
  colSpan?: 1 | 2;
}

export type FormType = 'TEAM_REGISTRATION' | 'PLAYER_REGISTRATION';

export interface FormTemplate {
  _id: string;
  auctionId: string;
  formType: FormType;
  name: string;
  version: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  fields: FormField[];
  createdBy?: string;
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TeamFormConfig {
  _id?: string;
  auctionId: string;
  teamId: string;
  formTemplateId: string;
  overrides: Record<
    string,
    {
      visible?: boolean;
      required?: boolean;
      editable?: boolean;
      options?: Array<{ label: string; value: string }>;
    }
  >;
}

export interface FormSubmission {
  _id: string;
  auctionId: string;
  formTemplateId: string;
  formVersion: number;
  formType: 'TEAM_REGISTRATION' | 'PLAYER_REGISTRATION';
  teamId?: string | null;
  submittedBy?: string | null;
  data: Record<string, any>;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminNote?: string;
  submittedAt: string;
}

export interface Sponsor {
  _id: string;
  auctionId: string;
  name: string;
  tier: 'TITLE' | 'POWERED_BY' | 'ASSOCIATE' | 'KIT' | 'MEDIA';
  logo: string;
  website?: string;
  order: number;
  createdAt?: string;
}

