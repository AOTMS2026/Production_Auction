'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  IoArrowBackOutline,
  IoCloseOutline,
  IoCheckmarkCircleOutline,
  IoEyeOutline,
  IoEyeOffOutline,
  IoColorPaletteOutline,
  IoDesktopOutline,
  IoTvOutline,
  IoLayersOutline,
  IoFlashOutline,
  IoSparklesOutline,
  IoRefreshOutline,
  IoVolumeHighOutline,
  IoGridOutline,
  IoShieldCheckmarkOutline,
  IoPricetagOutline,
  IoPersonOutline,
  IoPeopleOutline,
  IoCheckmarkOutline,
  IoCheckmarkDoneOutline,
  IoCloseCircleOutline,
  IoArrowUpOutline,
  IoArrowDownOutline,
  IoReorderThreeOutline,
  IoExpandOutline,
  IoContractOutline,
  IoImageOutline,
  IoTextOutline,
  IoTrophyOutline,
  IoAddOutline,
} from 'react-icons/io5';
import {
  Landmark,
  Pencil,
  Undo2,
  Eye,
  EyeOff,
  Shuffle,
  List,
  Gavel,
  X,
  Move,
  ChevronUp,
  ChevronDown,
  Check,
  SlidersHorizontal,
  LayoutGrid,
  Type,
  Maximize2,
  Columns,
  Sparkles,
  Layers,
  Tv,
  RefreshCw,
} from 'lucide-react';
import {
  getDisplayLayout,
  updateDisplayLayout,
  getEffectiveForm,
  getStoredToken,
  getTeams,
  getPlayers,
} from '@/lib/api';
import { AutoScrollText } from '@/components/ui/AutoScrollText';

// ===================== TYPE DEFINITIONS & EXPORTS =====================

export type ArenaSplitId = '9-3' | '8-4' | '7-5' | '10-2';
export type PlayerCardSplitId = '4-8' | '5-7' | '3-9' | '6-6';
export type PhotoPositionId = 'left' | 'right';
export type TeamsColumnsId = '1' | '2' | '3';
export type TeamCardSizeId = 'sm' | 'md' | 'lg';
export type NameFontSizeId = 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type BidFontSizeId = 'md' | 'lg' | 'xl' | '2xl';
export type SnoFontSizeId = 'sm' | 'md' | 'lg' | 'xl';
export type BadgesSizeId = 'sm' | 'md' | 'lg';
export type BadgesLayoutId = 'wrap' | 'grid-2' | 'grid-3' | 'grid-4';
export type ControlsSizeId = 'sm' | 'md' | 'lg';
export type CardElementId = 'sno' | 'name' | 'badges' | 'bid';

export type ThemePresetId = 'cyan' | 'gold' | 'emerald' | 'crimson' | 'sapphire' | 'purple';
export type CardLayoutId = 'stadium' | 'broadcast' | 'modern';
export type BackgroundStyleId = 'stadium_floodlights' | 'cyber_grid' | 'dark_arena' | 'gradient';

// Compatibility types for live/page.tsx
export type AvatarSizeId = 'sm' | 'md' | 'lg' | 'xl';
export type FontSizeId = 'sm' | 'md' | 'lg' | 'xl';
export type CardScaleId = 'compact' | 'normal' | 'grand';
export type FieldColumnsId = '1' | '2' | '3';

export interface DisplayFieldOption {
  key: string;
  label: string;
  visible: boolean;
  isSystem?: boolean;
  type?: string;
  options?: Array<{ label: string; value: string }>;
  placeholder?: string;
  demoValue?: string;
}

export interface PlayerDisplaySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  auctionId: string;
  onSaved?: () => void;
  initialPreviewTarget?: 'overall' | 'player' | 'team';
  auctionTitle?: string;
  roomCode?: string;
}

// ===================== CONFIGURATION MAPS =====================

export const ARENA_SPLIT_MAP: Record<
  ArenaSplitId,
  { label: string; ratio: string; desc: string; leftClass: string; rightClass: string }
> = {
  '9-3': {
    label: 'Dominant Player Showcase',
    ratio: '9 : 3 (67% / 33%)',
    desc: 'Maximum focus on player card with comfortable teams column',
    leftClass: 'lg:col-span-8 xl:col-span-8',
    rightClass: 'lg:col-span-4 xl:col-span-4',
  },
  '8-4': {
    label: 'Balanced Arena View',
    ratio: '8 : 4 (58% / 42%)',
    desc: 'Spacious player card with wider 2-column teams arena',
    leftClass: 'lg:col-span-7 xl:col-span-7',
    rightClass: 'lg:col-span-5 xl:col-span-5',
  },
  '7-5': {
    label: 'Wide Teams Column',
    ratio: '7 : 5 (50% / 50%)',
    desc: 'Gives maximum horizontal room for team cards and rosters',
    leftClass: 'lg:col-span-6 xl:col-span-6',
    rightClass: 'lg:col-span-6 xl:col-span-6',
  },
  '10-2': {
    label: 'Ultra Player Focus',
    ratio: '10 : 2 (75% / 25%)',
    desc: 'Broadcast view for large projectors with compact teams',
    leftClass: 'lg:col-span-9 xl:col-span-9',
    rightClass: 'lg:col-span-3 xl:col-span-3',
  },
};

export const CARD_SPLIT_MAP: Record<
  PlayerCardSplitId,
  { label: string; ratio: string; desc: string; photoClass: string; detailsClass: string }
> = {
  '4-8': {
    label: 'Standard Card Split',
    ratio: '4 : 8 (33% / 67%)',
    desc: '1/3 Player Photo, 2/3 Name & Details',
    photoClass: 'md:col-span-5 lg:col-span-4 xl:col-span-4',
    detailsClass: 'md:col-span-7 lg:col-span-8 xl:col-span-8',
  },
  '5-7': {
    label: 'Wide Photo Split',
    ratio: '5 : 7 (42% / 58%)',
    desc: 'Spacious photo column for full headshot clarity',
    photoClass: 'md:col-span-6 lg:col-span-5 xl:col-span-5',
    detailsClass: 'md:col-span-6 lg:col-span-7 xl:col-span-7',
  },
  '3-9': {
    label: 'Compact Photo Split',
    ratio: '3 : 9 (25% / 75%)',
    desc: 'Compact photo with maximum room for long player names',
    photoClass: 'md:col-span-4 lg:col-span-3 xl:col-span-3',
    detailsClass: 'md:col-span-8 lg:col-span-9 xl:col-span-9',
  },
  '6-6': {
    label: 'Equal Split',
    ratio: '6 : 6 (50% / 50%)',
    desc: 'Equal half-width for photo and details',
    photoClass: 'md:col-span-6 lg:col-span-6 xl:col-span-6',
    detailsClass: 'md:col-span-6 lg:col-span-6 xl:col-span-6',
  },
};

export const NAME_FONT_SIZE_MAP: Record<NameFontSizeId, { label: string; class: string }> = {
  sm: { label: 'Small', class: 'text-2xl sm:text-3xl lg:text-4xl' },
  md: { label: 'Medium', class: 'text-3xl sm:text-4xl lg:text-5xl' },
  lg: { label: 'Large', class: 'text-4xl sm:text-5xl lg:text-6xl' },
  xl: { label: 'XL Bold', class: 'text-4xl sm:text-5xl lg:text-6xl xl:text-7xl' },
  '2xl': { label: 'Jumbo Bold', class: 'text-5xl sm:text-6xl lg:text-7xl xl:text-8xl' },
};

export const BID_FONT_SIZE_MAP: Record<BidFontSizeId, { label: string; class: string }> = {
  md: { label: 'Medium (6xl)', class: 'text-4xl sm:text-5xl md:text-6xl' },
  lg: { label: 'Large (7xl)', class: 'text-5xl sm:text-6xl md:text-7xl' },
  xl: { label: 'XL Giant (8xl)', class: 'text-5xl sm:text-6xl md:text-7xl lg:text-8xl' },
  '2xl': { label: 'Monster (9xl)', class: 'text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl' },
};

export const SNO_FONT_SIZE_MAP: Record<SnoFontSizeId, { label: string; class: string }> = {
  sm: { label: 'Small', class: 'text-xl sm:text-2xl lg:text-3xl' },
  md: { label: 'Medium', class: 'text-2xl sm:text-3xl lg:text-4xl' },
  lg: { label: 'Large', class: 'text-3xl sm:text-4xl lg:text-5xl' },
  xl: { label: 'Jumbo Glow', class: 'text-3xl sm:text-4xl lg:text-5xl xl:text-6xl' },
};

export const BADGES_SIZE_MAP: Record<BadgesSizeId, { label: string; badgeClass: string; iconClass: string }> = {
  sm: { label: 'Compact', badgeClass: 'px-3 py-1 text-xs', iconClass: 'size-3.5' },
  md: { label: 'Standard', badgeClass: 'px-4 py-2 text-xs sm:text-sm', iconClass: 'size-4' },
  lg: { label: 'Large', badgeClass: 'px-5 py-2.5 text-sm sm:text-base', iconClass: 'size-5' },
};

export const CONTROLS_SIZE_MAP: Record<ControlsSizeId, { label: string; btnClass: string }> = {
  sm: { label: 'Compact', btnClass: 'px-4 py-2 text-xs' },
  md: { label: 'Standard', btnClass: 'px-5 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm' },
  lg: { label: 'Large', btnClass: 'px-7 py-3.5 text-sm sm:text-base' },
};

export const TEAMS_COLUMNS_MAP: Record<TeamsColumnsId, { label: string; gridClass: string }> = {
  '1': { label: '1 Column', gridClass: 'grid grid-cols-1 gap-2.5 content-start auto-rows-max' },
  '2': { label: '2 Columns (3 Rows Fit)', gridClass: 'grid grid-cols-2 gap-2.5 content-start auto-rows-max' },
  '3': { label: '3 Columns', gridClass: 'grid grid-cols-3 gap-2 content-start auto-rows-max' },
};

export const TEAM_CARD_SIZE_MAP: Record<
  TeamCardSizeId,
  {
    label: string;
    cardPad: string;
    logoSize: string;
    nameClass: string;
    purseClass: string;
    squadClass: string;
    coinSize: string;
  }
> = {
  sm: {
    label: 'Compact',
    cardPad: 'p-1.5',
    logoSize: 'size-7 sm:size-8',
    nameClass: 'text-[11px] font-bold leading-tight',
    purseClass: 'text-[10px] sm:text-[11px] font-bold',
    squadClass: 'text-[9px]',
    coinSize: 'size-3',
  },
  md: {
    label: 'Standard (3 Rows Fit)',
    cardPad: 'p-1.5 sm:p-2',
    logoSize: 'size-8 sm:size-9',
    nameClass: 'text-xs font-bold leading-tight',
    purseClass: 'text-xs font-bold',
    squadClass: 'text-[10px]',
    coinSize: 'size-3.5',
  },
  lg: {
    label: 'Large & Chunky',
    cardPad: 'p-2.5 sm:p-3',
    logoSize: 'size-10 sm:size-11',
    nameClass: 'text-xs sm:text-sm font-bold',
    purseClass: 'text-xs sm:text-sm font-bold',
    squadClass: 'text-[11px]',
    coinSize: 'size-4',
  },
};

export const THEME_PRESETS: Array<{
  id: ThemePresetId;
  label: string;
  color: string;
  bgLight: string;
  border: string;
  glow: string;
  textColor: string;
}> = [
  {
    id: 'cyan',
    label: 'Neon Cyber',
    color: '#00d2ee',
    bgLight: 'rgba(0,210,238,0.15)',
    border: '#00d2ee',
    glow: 'rgba(0,210,238,0.4)',
    textColor: 'text-[#00d2ee]',
  },
  {
    id: 'gold',
    label: 'IPL Gold',
    color: '#fbbf24',
    bgLight: 'rgba(251,191,36,0.15)',
    border: '#fbbf24',
    glow: 'rgba(251,191,36,0.4)',
    textColor: 'text-[#fbbf24]',
  },
  {
    id: 'emerald',
    label: 'Emerald Turf',
    color: '#10b981',
    bgLight: 'rgba(16,185,129,0.15)',
    border: '#10b981',
    glow: 'rgba(16,185,129,0.4)',
    textColor: 'text-[#10b981]',
  },
  {
    id: 'crimson',
    label: 'Crimson Blaze',
    color: '#f43f5e',
    bgLight: 'rgba(244,63,94,0.15)',
    border: '#f43f5e',
    glow: 'rgba(244,63,94,0.4)',
    textColor: 'text-[#f43f5e]',
  },
  {
    id: 'sapphire',
    label: 'Royal Sapphire',
    color: '#38bdf8',
    bgLight: 'rgba(56,189,248,0.15)',
    border: '#38bdf8',
    glow: 'rgba(56,189,248,0.4)',
    textColor: 'text-[#38bdf8]',
  },
  {
    id: 'purple',
    label: 'Imperial Violet',
    color: '#c084fc',
    bgLight: 'rgba(192,132,252,0.15)',
    border: '#c084fc',
    glow: 'rgba(192,132,252,0.4)',
    textColor: 'text-[#c084fc]',
  },
];

// Compatibility definitions for external components
export const AVATAR_SIZE_MAP: Record<AvatarSizeId, { label: string; class: string; px: number }> = {
  sm: { label: 'Small (80px)', class: 'size-20', px: 80 },
  md: { label: 'Medium (120px)', class: 'size-28 sm:size-32', px: 120 },
  lg: { label: 'Large (150px)', class: 'size-36 sm:size-40', px: 150 },
  xl: { label: 'Hero (180px)', class: 'size-44 sm:size-48', px: 180 },
};

export const FONT_SIZE_MAP: Record<
  FontSizeId,
  { label: string; nameClass: string; statClass: string; labelClass: string }
> = {
  sm: { label: 'Small', nameClass: 'text-xl sm:text-2xl', statClass: 'text-xs', labelClass: 'text-[9px]' },
  md: { label: 'Standard', nameClass: 'text-2xl sm:text-3xl', statClass: 'text-sm', labelClass: 'text-[10px]' },
  lg: { label: 'Large', nameClass: 'text-3xl sm:text-4xl', statClass: 'text-base', labelClass: 'text-xs' },
  xl: { label: 'Jumbo', nameClass: 'text-4xl sm:text-5xl', statClass: 'text-lg', labelClass: 'text-sm' },
};

export const CARD_SCALE_MAP: Record<CardScaleId, { label: string; padClass: string }> = {
  compact: { label: 'Compact', padClass: 'p-3.5 sm:p-4' },
  normal: { label: 'Standard', padClass: 'p-5 sm:p-6' },
  grand: { label: 'Grand Arena', padClass: 'p-6 sm:p-8' },
};

interface TeamRosterItem {
  name: string;
  role: string;
  price: number;
  code?: string;
  avatar?: string;
}

interface TeamPreviewData {
  _id: string;
  name: string;
  code: string;
  ownerName?: string;
  logo?: string;
  purseTotal: number;
  purseRemaining: number;
  maxPlayers: number;
  playersCount: number;
  players: TeamRosterItem[];
}

const DEFAULT_PREVIEW_TEAMS: TeamPreviewData[] = [
  {
    _id: 'team-akkil',
    name: 'Akkil Heights & Properties',
    code: 'AHP',
    ownerName: 'Team Owner',
    logo: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=200',
    purseTotal: 10000000,
    purseRemaining: 900,
    maxPlayers: 25,
    playersCount: 25,
    players: [],
  },
  {
    _id: 'team-yagna',
    name: 'Yagna Fire Crackers',
    code: 'YFC',
    ownerName: 'Team Owner',
    logo: 'https://images.unsplash.com/photo-1511193311914-0346f16efe90?w=200',
    purseTotal: 10000000,
    purseRemaining: 0,
    maxPlayers: 25,
    playersCount: 25,
    players: [],
  },
  {
    _id: 'team-ayron',
    name: 'Ayron Digital Solutions',
    code: 'ADS',
    ownerName: 'Team Owner',
    logo: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=200',
    purseTotal: 10000000,
    purseRemaining: 4600,
    maxPlayers: 25,
    playersCount: 25,
    players: [],
  },
  {
    _id: 'team-kairavam',
    name: 'Kairavam Sunrises',
    code: 'KS',
    ownerName: 'Team Owner',
    logo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
    purseTotal: 10000000,
    purseRemaining: 0,
    maxPlayers: 25,
    playersCount: 25,
    players: [],
  },
  {
    _id: 'team-littlebuds',
    name: "Little Bud's Smashers",
    code: 'LBS',
    ownerName: 'Team Owner',
    logo: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=200',
    purseTotal: 10000000,
    purseRemaining: 7800,
    maxPlayers: 25,
    playersCount: 25,
    players: [],
  },
  {
    _id: 'team-kanuri',
    name: 'Kanuri Royals',
    code: 'KR',
    ownerName: 'Team Owner',
    logo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=200',
    purseTotal: 10000000,
    purseRemaining: 9800,
    maxPlayers: 25,
    playersCount: 25,
    players: [],
  },
];

function formatPurseShort(val: number): string {
  if (val >= 10000000) return `${(val / 10000000).toFixed(1)}Cr`;
  if (val >= 100000) return `${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) {
    const k = val / 1000;
    return k % 1 === 0 ? `${k}K` : `${k.toFixed(1)}K`;
  }
  return val.toLocaleString();
}

// ===================== MAIN COMPONENT =====================

export const PlayerDisplaySettingsModal: React.FC<PlayerDisplaySettingsModalProps> = ({
  isOpen,
  onClose,
  auctionId,
  onSaved,
  initialPreviewTarget = 'overall',
  auctionTitle = 'PANTHERS B LEAGUE',
  roomCode = 'A21F00',
}) => {
  // Navigation Tabs in Customizer Studio
  const [activeTab, setActiveTab] = useState<'columns' | 'reorder' | 'fields' | 'theme' | 'widgets'>('columns');
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState<boolean>(true);

  // Preview Mode Switcher: 'overall' (Full live arena as in user screenshot) | 'player' | 'team'
  const [previewTarget, setPreviewTarget] = useState<'overall' | 'player' | 'team'>(initialPreviewTarget);

  useEffect(() => {
    if (isOpen) {
      setPreviewTarget(initialPreviewTarget || 'overall');
    }
  }, [isOpen, initialPreviewTarget]);

  // ================= 1. COLUMN-WISE & SIZE ADJUSTMENT STATE =================
  const [arenaSplit, setArenaSplit] = useState<ArenaSplitId>('8-4');
  const [playerCardSplit, setPlayerCardSplit] = useState<PlayerCardSplitId>('4-8');
  const [photoPosition, setPhotoPosition] = useState<PhotoPositionId>('left');
  const [badgesLayout, setBadgesLayout] = useState<BadgesLayoutId>('wrap');

  // Element Font & Component Sizing
  const [nameFontSize, setNameFontSize] = useState<NameFontSizeId>('2xl');
  const [bidFontSize, setBidFontSize] = useState<BidFontSizeId>('2xl');
  const [snoFontSize, setSnoFontSize] = useState<SnoFontSizeId>('xl');
  const [badgesSize, setBadgesSize] = useState<BadgesSizeId>('md');
  const [controlsSize, setControlsSize] = useState<ControlsSizeId>('md');
  const [photoAspect, setPhotoAspect] = useState<'square' | 'tall' | 'auto'>('tall');

  // TEAMS Column-wise Arrangement & Size Options (Default 2 Columns, 3 Rows Fit)
  const [teamsColumns, setTeamsColumns] = useState<TeamsColumnsId>('2');
  const [teamCardSize, setTeamCardSize] = useState<TeamCardSizeId>('md');

  // Compatibility Size State
  const [avatarSize, setAvatarSize] = useState<AvatarSizeId>('md');
  const [fontSize, setFontSize] = useState<FontSizeId>('md');
  const [cardScale, setCardScale] = useState<CardScaleId>('normal');
  const [fieldColumns, setFieldColumns] = useState<FieldColumnsId>('2');

  // ================= 2. DRAG & DROP POSITIONS ORDER STATE =================
  // Movable elements on the Player Card
  const [elementOrder, setElementOrder] = useState<CardElementId[]>(['sno', 'name', 'badges', 'bid']);
  const [draggedElementId, setDraggedElementId] = useState<CardElementId | null>(null);
  const [dragOverElementId, setDragOverElementId] = useState<CardElementId | null>(null);

  // Form Fields Drag and Drop
  const [draggedFieldKey, setDraggedFieldKey] = useState<string | null>(null);
  const [dragOverFieldKey, setDragOverFieldKey] = useState<string | null>(null);

  // ================= 3. THEME & AMBIENCE STATE =================
  const [themeColor, setThemeColor] = useState<ThemePresetId>('cyan');
  const [cardLayout, setCardLayout] = useState<CardLayoutId>('stadium');
  const [backgroundStyle, setBackgroundStyle] = useState<BackgroundStyleId>('stadium_floodlights');
  const [customTagline, setCustomTagline] = useState<string>('OFFICIAL AUCTION ARENA');

  // Widgets & Overlays
  const [showSponsors, setShowSponsors] = useState<boolean>(true);
  const [showTeamPurses, setShowTeamPurses] = useState<boolean>(true);
  const [showBidTicker, setShowBidTicker] = useState<boolean>(true);
  const [showSoundEffects, setShowSoundEffects] = useState<boolean>(true);
  const [showPillsUnderPhoto, setShowPillsUnderPhoto] = useState<boolean>(true);

  // ================= 4. DATA & API STATE =================
  const [fields, setFields] = useState<DisplayFieldOption[]>([]);
  const [teamsList, setTeamsList] = useState<TeamPreviewData[]>(DEFAULT_PREVIEW_TEAMS);
  const [selectedTeamIndex, setSelectedTeamIndex] = useState<number>(0);
  const [tournamentPlayers, setTournamentPlayers] = useState<any[]>([]);
  const [samplePlayerIndex, setSamplePlayerIndex] = useState<number>(0);

  // Live Interactive Preview State (Simulation)
  const [simulatedBid, setSimulatedBid] = useState<number>(1000);
  const [simulatedMode, setSimulatedMode] = useState<'RANDOM' | 'MANUAL'>('RANDOM');

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  // Active theme object
  const activeTheme = useMemo(() => {
    return THEME_PRESETS.find((t) => t.id === themeColor) || THEME_PRESETS[0];
  }, [themeColor]);

  // Selected Team for Team Preview
  const activeSelectedTeam = useMemo(() => {
    return teamsList[selectedTeamIndex] || teamsList[0] || DEFAULT_PREVIEW_TEAMS[0];
  }, [teamsList, selectedTeamIndex]);

  // Active preview player on block
  const previewPlayer = useMemo(() => {
    if (tournamentPlayers.length > 0) {
      return tournamentPlayers[samplePlayerIndex % tournamentPlayers.length];
    }
    return {
      _id: 'p-jaya',
      name: 'JAYAVEER',
      playerCode: '95',
      profileImage: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=600',
      basePrice: 1000,
      role: 'optA',
      experience: '1-3 years',
      sport: 'Mangalagiri',
      customFields: {
        age: '10 Years',
        gender: 'optA',
        grade: 'optA',
        category: '1-3 years',
        chapter: 'Mangalagiri',
      },
    };
  }, [tournamentPlayers, samplePlayerIndex]);

  // ================= LOAD SAVED LAYOUT & FORM FIELDS =================
  useEffect(() => {
    if (!isOpen) return;

    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        setSuccess(false);
        const token = getStoredToken() || '';

        const [layoutRes, formRes, teamsRes, playersRes] = await Promise.all([
          getDisplayLayout(auctionId, token).catch(() => ({ data: {} })),
          getEffectiveForm(auctionId, 'PLAYER_REGISTRATION').catch(() => ({ fields: [] })),
          getTeams(auctionId).catch(() => []),
          getPlayers(auctionId).catch(() => []),
        ]);

        const layoutData = layoutRes.data || {};

        // Column and Sizing state
        if (layoutData.arenaSplit) setArenaSplit(layoutData.arenaSplit);
        if (layoutData.playerCardSplit) setPlayerCardSplit(layoutData.playerCardSplit);
        if (layoutData.photoPosition) setPhotoPosition(layoutData.photoPosition);
        if (layoutData.badgesLayout) setBadgesLayout(layoutData.badgesLayout);
        if (layoutData.nameFontSize) setNameFontSize(layoutData.nameFontSize);
        if (layoutData.bidFontSize) setBidFontSize(layoutData.bidFontSize);
        if (layoutData.snoFontSize) setSnoFontSize(layoutData.snoFontSize);
        if (layoutData.badgesSize) setBadgesSize(layoutData.badgesSize);
        if (layoutData.controlsSize) setControlsSize(layoutData.controlsSize);
        if (layoutData.photoAspect) setPhotoAspect(layoutData.photoAspect);
        if (layoutData.teamsColumns) setTeamsColumns(layoutData.teamsColumns);
        if (layoutData.teamCardSize) setTeamCardSize(layoutData.teamCardSize);
        if (Array.isArray(layoutData.elementOrder) && layoutData.elementOrder.length > 0) {
          setElementOrder(layoutData.elementOrder);
        }

        // Theme and ambience
        if (layoutData.themeColor) setThemeColor(layoutData.themeColor);
        if (layoutData.cardLayout) setCardLayout(layoutData.cardLayout);
        if (layoutData.backgroundStyle) setBackgroundStyle(layoutData.backgroundStyle);
        if (layoutData.customTagline !== undefined) setCustomTagline(layoutData.customTagline);
        if (layoutData.showSponsors !== undefined) setShowSponsors(layoutData.showSponsors);
        if (layoutData.showTeamPurses !== undefined) setShowTeamPurses(layoutData.showTeamPurses);
        if (layoutData.showBidTicker !== undefined) setShowBidTicker(layoutData.showBidTicker);
        if (layoutData.showSoundEffects !== undefined) setShowSoundEffects(layoutData.showSoundEffects);
        if (layoutData.showPillsUnderPhoto !== undefined) setShowPillsUnderPhoto(layoutData.showPillsUnderPhoto);

        // Saved field keys and order
        const savedVisibleKeys: string[] | undefined = layoutData.visibleFields;
        const savedFieldOrder: string[] = layoutData.fieldOrder || [];

        // STRICTLY use fields from the Player Registration Form!
        const rawFields = Array.isArray(formRes.fields) ? formRes.fields : [];
        const validFormFields = rawFields.filter((f: any) => {
          if (!f || !f.key) return false;
          if (['consent', 'section', 'description', 'paymentMode', 'paymentUpload'].includes(f.type)) return false;
          if (['termsConsent'].includes(f.key)) return false;
          return true;
        });

        let loadedFields: DisplayFieldOption[] = [];

        if (validFormFields.length > 0) {
          loadedFields = validFormFields.map((f: any) => {
            const isVisible =
              savedVisibleKeys !== undefined
                ? savedVisibleKeys.includes(f.key) || (f.label ? savedVisibleKeys.includes(f.label) : false)
                : true;

            return {
              key: f.key,
              label: f.label || f.key,
              visible: isVisible,
              isSystem: ['name', 'playerName', 'role', 'basePrice', 'sport', 'experience'].includes(f.key),
              type: f.type,
              options: f.options,
              placeholder: f.placeholder,
            };
          });
        } else {
          // Fallback fields matching screenshot
          loadedFields = [
            { key: 'role', label: 'Primary Playing Role', visible: true, isSystem: true },
            { key: 'experience', label: 'Competitive Experience', visible: true, isSystem: true },
            { key: 'chapter', label: 'Chapter / Location', visible: true, isSystem: true },
            { key: 'age', label: 'Age', visible: true, isSystem: false },
            { key: 'gender', label: 'Gender', visible: true, isSystem: false },
            { key: 'battingStyle', label: 'Batting Style', visible: false, isSystem: false },
            { key: 'bowlingStyle', label: 'Bowling Style', visible: false, isSystem: false },
          ];
        }

        // Apply saved order
        if (savedFieldOrder.length > 0) {
          loadedFields.sort((a, b) => {
            const idxA = savedFieldOrder.indexOf(a.key);
            const idxB = savedFieldOrder.indexOf(b.key);
            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            if (idxA !== -1) return -1;
            if (idxB !== -1) return 1;
            return 0;
          });
        }

        setFields(loadedFields);

        // Populate tournament teams
        if (teamsRes && Array.isArray(teamsRes) && teamsRes.length > 0) {
          const mappedTeams: TeamPreviewData[] = teamsRes.map((t: any) => {
            const teamSquad: TeamRosterItem[] = (playersRes || [])
              .filter((p: any) => {
                const pTeamId = typeof p.teamId === 'object' && p.teamId ? p.teamId._id : p.teamId;
                return pTeamId === t._id;
              })
              .map((p: any) => ({
                name: p.name,
                role: p.role || 'Player',
                price: p.soldPrice || p.basePrice || 0,
                code: p.playerCode ? `#${p.playerCode}` : undefined,
                avatar: p.profileImage,
              }));

            return {
              _id: t._id,
              name: t.name,
              code: t.code || t.name.slice(0, 3).toUpperCase(),
              ownerName: t.ownerName || t.managerName || 'Team Owner',
              logo: t.logo || 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=200',
              purseTotal: t.purseTotal || 10000000,
              purseRemaining: t.purseRemaining !== undefined ? t.purseRemaining : (t.purseTotal || 10000000),
              maxPlayers: t.maxPlayers || 15,
              playersCount: teamSquad.length,
              players: teamSquad,
            };
          });
          setTeamsList(mappedTeams);
        }

        // Populate tournament players
        if (playersRes && Array.isArray(playersRes) && playersRes.length > 0) {
          setTournamentPlayers(playersRes);
          setSimulatedBid(playersRes[0]?.basePrice || 1000);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load tournament display settings.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [isOpen, auctionId]);

  // ================= SAVE LAYOUT CONFIGURATION =================
  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      const token = getStoredToken() || '';
      const visibleFields = fields.filter((f) => f.visible).map((f) => f.key);
      const fieldOrder = fields.map((f) => f.key);

      const payload = {
        arenaSplit,
        playerCardSplit,
        photoPosition,
        badgesLayout,
        nameFontSize,
        bidFontSize,
        snoFontSize,
        badgesSize,
        controlsSize,
        photoAspect,
        teamsColumns,
        teamCardSize,
        elementOrder,
        visibleFields,
        fieldOrder,
        themeColor,
        cardLayout,
        backgroundStyle,
        customTagline,
        showSponsors,
        showTeamPurses,
        showBidTicker,
        showSoundEffects,
        showPillsUnderPhoto,
        // Legacy props
        avatarSize,
        fontSize,
        cardScale,
        fieldColumns,
      };

      await updateDisplayLayout(auctionId, payload, token);
      setSuccess(true);
      if (onSaved) onSaved();

      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Failed to save customized auction display layout.');
    } finally {
      setSaving(false);
    }
  };

  // ================= DRAG & DROP: CARD ELEMENTS HIERARCHY =================
  const handleElementDragStart = (e: React.DragEvent, id: CardElementId) => {
    e.dataTransfer.setData('text/plain', id);
    setDraggedElementId(id);
  };

  const handleElementDrop = (e: React.DragEvent, targetId: CardElementId) => {
    e.preventDefault();
    const sourceId = (draggedElementId || e.dataTransfer.getData('text/plain')) as CardElementId;
    if (!sourceId || sourceId === targetId) {
      setDraggedElementId(null);
      setDragOverElementId(null);
      return;
    }
    setElementOrder((prev) => {
      const sourceIndex = prev.indexOf(sourceId);
      const targetIndex = prev.indexOf(targetId);
      if (sourceIndex === -1 || targetIndex === -1) return prev;
      const updated = [...prev];
      const [moved] = updated.splice(sourceIndex, 1);
      updated.splice(targetIndex, 0, moved);
      return updated;
    });
    setDraggedElementId(null);
    setDragOverElementId(null);
  };

  const handleMoveElement = (id: CardElementId, direction: 'up' | 'down') => {
    setElementOrder((prev) => {
      const idx = prev.indexOf(id);
      if (idx === -1) return prev;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const updated = [...prev];
      const [moved] = updated.splice(idx, 1);
      updated.splice(targetIdx, 0, moved);
      return updated;
    });
  };

  // ================= DRAG & DROP: FORM FIELDS =================
  const handleFieldDragStart = (e: React.DragEvent, key: string) => {
    e.dataTransfer.setData('text/plain', key);
    setDraggedFieldKey(key);
  };

  const handleFieldDrop = (e: React.DragEvent, targetKey: string) => {
    e.preventDefault();
    const sourceKey = draggedFieldKey || e.dataTransfer.getData('text/plain');
    if (!sourceKey || sourceKey === targetKey) {
      setDraggedFieldKey(null);
      setDragOverFieldKey(null);
      return;
    }
    setFields((prev) => {
      const sourceIndex = prev.findIndex((f) => f.key === sourceKey);
      const targetIndex = prev.findIndex((f) => f.key === targetKey);
      if (sourceIndex === -1 || targetIndex === -1) return prev;
      const updated = [...prev];
      const [moved] = updated.splice(sourceIndex, 1);
      updated.splice(targetIndex, 0, moved);
      return updated;
    });
    setDraggedFieldKey(null);
    setDragOverFieldKey(null);
  };

  const handleMoveField = (key: string, direction: 'up' | 'down') => {
    setFields((prev) => {
      const idx = prev.findIndex((f) => f.key === key);
      if (idx === -1) return prev;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const updated = [...prev];
      const [moved] = updated.splice(idx, 1);
      updated.splice(targetIdx, 0, moved);
      return updated;
    });
  };

  const handleToggleField = (key: string) => {
    setFields((prev) =>
      prev.map((f) => {
        if (f.key === key) {
          return { ...f, visible: !f.visible };
        }
        return f;
      })
    );
  };

  const handleToggleAllFields = (val: boolean) => {
    setFields((prev) => prev.map((f) => ({ ...f, visible: val })));
  };

  // Helper for demo values in preview
  const getFieldDemoValue = (field: DisplayFieldOption) => {
    if (field.demoValue) return field.demoValue;
    const k = field.key.toLowerCase();
    const custom = (previewPlayer.customFields || {}) as Record<string, any>;
    if (custom[field.key]) return String(custom[field.key]);
    if (k.includes('age')) return '10 Years';
    if (k.includes('gender')) return 'Male';
    if (k.includes('role')) return previewPlayer.role || 'optA';
    if (k.includes('experience')) return previewPlayer.experience || '1-3 years';
    if (k.includes('chapter') || k.includes('city')) return previewPlayer.sport || 'Mangalagiri';
    if (k.includes('bat')) return 'Right Hand Bat';
    if (k.includes('bowl')) return 'Right Arm Medium';
    if (k.includes('price')) return '1,000';
    if (k.includes('phone') || k.includes('whatsapp') || k.includes('contact')) return '+91 98765 43210';
    return 'Prime Athlete';
  };

  const visibleCount = fields.filter((f) => f.visible).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-2 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full h-full max-w-[1920px] sm:h-[98vh] sm:rounded-2xl bg-[#010e17] border border-[#0d3f4f] shadow-2xl flex flex-col overflow-hidden text-white font-sans">
        
        {/* Global Alert Notification */}
        {error && (
          <div className="bg-rose-500/15 border-b border-rose-500/30 px-4 py-2 flex items-center justify-between text-xs font-mono text-rose-300 shrink-0 z-30">
            <div className="flex items-center gap-2">
              <IoCloseCircleOutline className="size-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="underline hover:text-white cursor-pointer">
              Dismiss
            </button>
          </div>
        )}
        {success && (
          <div className="bg-emerald-500/15 border-b border-emerald-500/40 px-4 py-2 flex items-center justify-between text-xs font-mono text-emerald-300 shrink-0 z-30">
            <div className="flex items-center gap-2">
              <IoCheckmarkCircleOutline className="size-4 text-emerald-400 shrink-0" />
              <span>Auction Display UI Design successfully updated & published live!</span>
            </div>
            <button onClick={() => setSuccess(false)} className="underline hover:text-white cursor-pointer">
              Dismiss
            </button>
          </div>
        )}

        {/* ===================== UNIFIED TOP HEADER BAR (REAL LIVE AUCTION UI) ===================== */}
        <header className="h-14 sm:h-16 px-3 sm:px-4 bg-[#011420] border-b border-[#0d3f4f] flex items-center justify-between shrink-0 gap-2 z-20">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl bg-[#031d27] border border-[#0d3f4f] hover:border-[#00d2ee] text-[#7fa3b0] hover:text-[#00d2ee] transition-all cursor-pointer shrink-0"
              title="Close Preview & Return"
            >
              <IoArrowBackOutline size={18} />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-mono font-bold tracking-wider text-white uppercase truncate">
                  {auctionTitle}
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#00d2ee]/15 text-[#00d2ee] border border-[#00d2ee]/40 shrink-0">
                  Normal Mode
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono text-[#7fa3b0]">
                <span>Code: {roomCode}</span>
                <span className="text-white/20">•</span>
                <span className="text-emerald-400 hidden sm:inline">Preview Studio</span>
              </div>
            </div>
          </div>

          {/* Center/Right Toolbar */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Theme Pill */}
            <div
              className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-mono font-bold"
              style={{
                backgroundColor: activeTheme.bgLight,
                borderColor: activeTheme.border,
                color: activeTheme.color,
              }}
            >
              <span className="size-2 rounded-full" style={{ backgroundColor: activeTheme.color }} />
              <span>{activeTheme.label}</span>
            </div>

            {/* Sync Active Pill */}
            <div className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 text-[11px] font-mono">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Sync Active</span>
            </div>

            {/* Target View Switcher */}
            <div className="hidden xl:inline-flex p-0.5 rounded-xl bg-[#011420] border border-[#0d3f4f]">
              <button
                type="button"
                onClick={() => setPreviewTarget('overall')}
                className={`px-2 py-1 text-[11px] font-mono rounded-lg transition-all cursor-pointer ${
                  previewTarget === 'overall' ? 'bg-[#00d2ee] text-[#02131b] font-bold' : 'text-[#7fa3b0] hover:text-white'
                }`}
                style={previewTarget === 'overall' ? { backgroundColor: activeTheme.color } : {}}
              >
                Overall Arena
              </button>
              <button
                type="button"
                onClick={() => setPreviewTarget('player')}
                className={`px-2 py-1 text-[11px] font-mono rounded-lg transition-all cursor-pointer ${
                  previewTarget === 'player' ? 'bg-[#00d2ee] text-[#02131b] font-bold' : 'text-[#7fa3b0] hover:text-white'
                }`}
                style={previewTarget === 'player' ? { backgroundColor: activeTheme.color } : {}}
              >
                Player Focus
              </button>
              <button
                type="button"
                onClick={() => setPreviewTarget('team')}
                className={`px-2 py-1 text-[11px] font-mono rounded-lg transition-all cursor-pointer ${
                  previewTarget === 'team' ? 'bg-[#00d2ee] text-[#02131b] font-bold' : 'text-[#7fa3b0] hover:text-white'
                }`}
                style={previewTarget === 'team' ? { backgroundColor: activeTheme.color } : {}}
              >
                Team Roster
              </button>
            </div>

            {/* Quick Test Teams Columns */}
            <div className="hidden sm:inline-flex items-center gap-1 p-0.5 rounded-lg bg-[#011420] border border-[#0d3f4f] text-[10px] font-mono">
              <span className="px-1 text-[#7fa3b0] font-bold">Teams:</span>
              {(['1', '2', '3'] as TeamsColumnsId[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setTeamsColumns(c)}
                  className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                    teamsColumns === c ? 'bg-[#00d2ee] text-[#02131b] font-bold' : 'text-[#7fa3b0] hover:text-white'
                  }`}
                  style={teamsColumns === c ? { backgroundColor: activeTheme.color } : {}}
                  title={`Test ${c} Column Teams Grid`}
                >
                  {c}C
                </button>
              ))}
            </div>

            {/* Quick Test Teams Size */}
            <div className="hidden sm:inline-flex items-center gap-1 p-0.5 rounded-lg bg-[#011420] border border-[#0d3f4f] text-[10px] font-mono">
              <span className="px-1 text-[#7fa3b0] font-bold">Size:</span>
              {(['sm', 'md', 'lg'] as TeamCardSizeId[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setTeamCardSize(s)}
                  className={`px-1.5 py-0.5 rounded transition-all cursor-pointer font-bold ${
                    teamCardSize === s ? 'bg-amber-400 text-amber-950' : 'text-[#7fa3b0] hover:text-white'
                  }`}
                  title={`Test ${s.toUpperCase()} Team Size`}
                >
                  {s.toUpperCase()}
                </button>
              ))}
            </div>

            {/* ================= CORNER EDIT / CUSTOMIZE DISPLAY BUTTON ================= */}
            <button
              type="button"
              onClick={() => setIsEditDrawerOpen((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md ${
                isEditDrawerOpen
                  ? 'bg-amber-400 text-amber-950 shadow-[0_0_15px_rgba(251,191,36,0.5)]'
                  : 'border text-[#00d2ee]'
              }`}
              style={
                !isEditDrawerOpen
                  ? {
                      backgroundColor: activeTheme.bgLight,
                      borderColor: activeTheme.border,
                      color: activeTheme.color,
                      boxShadow: `0 0 15px ${activeTheme.glow}`,
                    }
                  : {}
              }
              title="Click to open or close corner customization drawer"
            >
              <SlidersHorizontal size={14} />
              <span>{isEditDrawerOpen ? 'Close Editor' : 'Customize UI'}</span>
            </button>

            {/* Save Button */}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-[#02131b] transition-all cursor-pointer shadow-md active:scale-95 disabled:opacity-50"
              style={{
                backgroundColor: activeTheme.color,
                boxShadow: `0 0 15px ${activeTheme.glow}`,
              }}
            >
              {saving ? (
                <>
                  <RefreshCw className="size-3.5 animate-spin" />
                  <span className="hidden sm:inline">Saving...</span>
                </>
              ) : (
                <>
                  <Check className="size-3.5 stroke-[3]" />
                  <span>Save</span>
                </>
              )}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#7fa3b0] hover:text-white transition-all cursor-pointer"
              title="Close modal"
            >
              <IoCloseOutline size={20} />
            </button>
          </div>
        </header>

        {/* ===================== WORKSPACE: FULL PAGE ARENA + FLOATING CORNER DRAWER ===================== */}
        <div className="relative flex-1 min-h-0 flex flex-col overflow-hidden bg-[#010e17]">
          {/* ================= CORNER FLOATING EDIT DRAWER (SIZE RESIZE, REMOVE FIELDS, COLOR CHANGE) ================= */}
          {isEditDrawerOpen && (
            <div className="absolute top-0 right-0 bottom-0 w-full sm:w-[480px] lg:w-[520px] z-50 bg-[#011420]/95 backdrop-blur-2xl border-l-2 border-[#00d2ee] shadow-[-25px_0_60px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
              {/* Drawer Header */}
              <div className="px-5 py-3.5 border-b border-[#0d3f4f] bg-[#021826] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <div
                    className="size-8 rounded-xl flex items-center justify-center border shadow-sm shrink-0"
                    style={{
                      backgroundColor: activeTheme.bgLight,
                      borderColor: activeTheme.border,
                    }}
                  >
                    <SlidersHorizontal size={16} style={{ color: activeTheme.color }} />
                  </div>
                  <div>
                    <h3 className="text-sm font-mono font-bold tracking-wider uppercase text-white flex items-center gap-2">
                      <span>Customize Display</span>
                      <span
                        className="px-2 py-0.2 rounded-full text-[9px] font-mono font-bold uppercase"
                        style={{ backgroundColor: activeTheme.bgLight, color: activeTheme.color }}
                      >
                        {activeTheme.label}
                      </span>
                    </h3>
                    <p className="text-[11px] text-[#7fa3b0]">Live size resize, remove fields & color changes</p>
                  </div>
                </div>

                {/* Close Drawer Button */}
                <button
                  type="button"
                  onClick={() => setIsEditDrawerOpen(false)}
                  className="size-8 rounded-xl bg-white/5 hover:bg-white/10 text-[#7fa3b0] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                  title="Hide Editor (View Full Screen)"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Studio Navigation Tabs */}
              <div className="flex border-b border-[#0d3f4f] bg-[#02141e] px-2 shrink-0 overflow-x-auto custom-scrollbar">
              <button
                type="button"
                onClick={() => setActiveTab('columns')}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-mono uppercase tracking-wider font-semibold border-b-2 cursor-pointer transition-all whitespace-nowrap ${
                  activeTab === 'columns'
                    ? 'border-[#00d2ee] text-white'
                    : 'border-transparent text-[#7fa3b0] hover:text-white'
                }`}
                style={activeTab === 'columns' ? { borderColor: activeTheme.color, color: activeTheme.color } : {}}
              >
                <Columns className="size-3.5" />
                <span>Columns & Sizing</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('reorder')}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-mono uppercase tracking-wider font-semibold border-b-2 cursor-pointer transition-all whitespace-nowrap ${
                  activeTab === 'reorder'
                    ? 'border-[#00d2ee] text-white'
                    : 'border-transparent text-[#7fa3b0] hover:text-white'
                }`}
                style={activeTab === 'reorder' ? { borderColor: activeTheme.color, color: activeTheme.color } : {}}
              >
                <Move className="size-3.5" />
                <span>Drag & Reorder</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('fields')}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-mono uppercase tracking-wider font-semibold border-b-2 cursor-pointer transition-all whitespace-nowrap ${
                  activeTab === 'fields'
                    ? 'border-[#00d2ee] text-white'
                    : 'border-transparent text-[#7fa3b0] hover:text-white'
                }`}
                style={activeTab === 'fields' ? { borderColor: activeTheme.color, color: activeTheme.color } : {}}
              >
                <IoEyeOutline className="size-3.5" />
                <span>Form Fields ({visibleCount}/{fields.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('theme')}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-mono uppercase tracking-wider font-semibold border-b-2 cursor-pointer transition-all whitespace-nowrap ${
                  activeTab === 'theme'
                    ? 'border-[#00d2ee] text-white'
                    : 'border-transparent text-[#7fa3b0] hover:text-white'
                }`}
                style={activeTab === 'theme' ? { borderColor: activeTheme.color, color: activeTheme.color } : {}}
              >
                <IoColorPaletteOutline className="size-3.5" />
                <span>Theme & Arena</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('widgets')}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-mono uppercase tracking-wider font-semibold border-b-2 cursor-pointer transition-all whitespace-nowrap ${
                  activeTab === 'widgets'
                    ? 'border-[#00d2ee] text-white'
                    : 'border-transparent text-[#7fa3b0] hover:text-white'
                }`}
                style={activeTab === 'widgets' ? { borderColor: activeTheme.color, color: activeTheme.color } : {}}
              >
                <IoShieldCheckmarkOutline className="size-3.5" />
                <span>Widgets</span>
              </button>
            </div>

            {/* TAB CONTENTS CONTAINER */}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 space-y-5">
              {/* ================= TAB 1: COLUMNS & SIZING ================= */}
              {activeTab === 'columns' && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  {/* 1. Arena Split Ratio (Left Player Card vs Right Teams Card) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-mono text-white/90 uppercase tracking-wider font-bold flex items-center gap-1.5">
                        <Columns className="size-3.5 text-[#00d2ee]" style={{ color: activeTheme.color }} />
                        <span>Arena Column Split Ratio (Player vs Teams)</span>
                      </label>
                      <span className="text-[11px] font-mono text-emerald-400 font-bold">
                        {ARENA_SPLIT_MAP[arenaSplit].ratio}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {(Object.keys(ARENA_SPLIT_MAP) as ArenaSplitId[]).map((splitKey) => {
                        const opt = ARENA_SPLIT_MAP[splitKey];
                        const isSelected = arenaSplit === splitKey;
                        return (
                          <div
                            key={splitKey}
                            onClick={() => setArenaSplit(splitKey)}
                            className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                              isSelected
                                ? 'bg-[#021d27] border-[#00d2ee] shadow-[0_0_15px_rgba(0,210,238,0.3)] ring-1 ring-[#00d2ee]'
                                : 'bg-[#011420] border-[#0d3f4f] hover:border-white/30 text-[#7fa3b0]'
                            }`}
                            style={isSelected ? { borderColor: activeTheme.border } : {}}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-mono font-bold text-white">{opt.label}</span>
                              <span
                                className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
                                style={isSelected ? { backgroundColor: activeTheme.bgLight, color: activeTheme.color } : {}}
                              >
                                {opt.ratio}
                              </span>
                            </div>
                            <span className="text-[10px] text-[#7fa3b0] leading-snug">{opt.desc}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Player Card Split Ratio (Photo vs Details) */}
                  <div className="space-y-2 pt-2 border-t border-[#0d3f4f]/50">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-mono text-white/90 uppercase tracking-wider font-bold flex items-center gap-1.5">
                        <LayoutGrid className="size-3.5 text-[#00d2ee]" style={{ color: activeTheme.color }} />
                        <span>Player Card Split Ratio (Photo vs Details)</span>
                      </label>
                      <span className="text-[11px] font-mono text-amber-400 font-bold">
                        {CARD_SPLIT_MAP[playerCardSplit].ratio}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {(Object.keys(CARD_SPLIT_MAP) as PlayerCardSplitId[]).map((cKey) => {
                        const opt = CARD_SPLIT_MAP[cKey];
                        const isSelected = playerCardSplit === cKey;
                        return (
                          <div
                            key={cKey}
                            onClick={() => setPlayerCardSplit(cKey)}
                            className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-1 ${
                              isSelected
                                ? 'bg-[#021d27] border-[#00d2ee] shadow-[0_0_12px_rgba(0,210,238,0.25)] ring-1 ring-[#00d2ee]'
                                : 'bg-[#011420] border-[#0d3f4f] hover:border-white/30 text-[#7fa3b0]'
                            }`}
                            style={isSelected ? { borderColor: activeTheme.border } : {}}
                          >
                            <span className="text-xs font-mono font-bold text-white">{opt.label}</span>
                            <span className="text-[10px] text-[#7fa3b0]">{opt.desc}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. Photo Position & Photo Aspect */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#0d3f4f]/50">
                    <div>
                      <label className="text-xs font-mono text-white/90 uppercase tracking-wider font-bold block mb-1.5">
                        Photo Position
                      </label>
                      <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[#011420] border border-[#0d3f4f]">
                        <button
                          type="button"
                          onClick={() => setPhotoPosition('left')}
                          className={`py-1.5 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer ${
                            photoPosition === 'left' ? 'bg-[#00d2ee] text-[#02131b]' : 'text-[#7fa3b0] hover:text-white'
                          }`}
                          style={photoPosition === 'left' ? { backgroundColor: activeTheme.color } : {}}
                        >
                          Left
                        </button>
                        <button
                          type="button"
                          onClick={() => setPhotoPosition('right')}
                          className={`py-1.5 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer ${
                            photoPosition === 'right' ? 'bg-[#00d2ee] text-[#02131b]' : 'text-[#7fa3b0] hover:text-white'
                          }`}
                          style={photoPosition === 'right' ? { backgroundColor: activeTheme.color } : {}}
                        >
                          Right
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-mono text-white/90 uppercase tracking-wider font-bold block mb-1.5">
                        Photo Aspect Ratio
                      </label>
                      <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-[#011420] border border-[#0d3f4f]">
                        {[
                          { id: 'square', label: '1:1' },
                          { id: 'tall', label: '4:5' },
                          { id: 'auto', label: 'Auto' },
                        ].map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setPhotoAspect(item.id as any)}
                            className={`py-1.5 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer text-center ${
                              photoAspect === item.id ? 'bg-[#00d2ee] text-[#02131b]' : 'text-[#7fa3b0] hover:text-white'
                            }`}
                            style={photoAspect === item.id ? { backgroundColor: activeTheme.color } : {}}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 4. Font Sizing Controls (Name, Bid, S.NO) */}
                  <div className="space-y-3 pt-2 border-t border-[#0d3f4f]/50">
                    <label className="text-xs font-mono text-white/90 uppercase tracking-wider font-bold flex items-center gap-1.5">
                      <Type className="size-3.5 text-[#00d2ee]" style={{ color: activeTheme.color }} />
                      <span>Element Font Sizes (Increase / Decrease)</span>
                    </label>

                    {/* Player Name Font Size */}
                    <div className="p-3 rounded-2xl bg-[#011420] border border-[#0d3f4f] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-white font-semibold">Player Full Name Size</span>
                        <span className="text-[11px] font-mono text-[#00d2ee]" style={{ color: activeTheme.color }}>
                          {NAME_FONT_SIZE_MAP[nameFontSize].label}
                        </span>
                      </div>
                      <div className="grid grid-cols-5 gap-1">
                        {(['sm', 'md', 'lg', 'xl', '2xl'] as NameFontSizeId[]).map((sz) => (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => setNameFontSize(sz)}
                            className={`py-1.5 text-[11px] font-mono font-bold rounded-lg border transition-all cursor-pointer ${
                              nameFontSize === sz
                                ? 'bg-[#00d2ee] text-[#02131b] border-[#00d2ee] shadow-sm'
                                : 'bg-[#021822] border-white/10 text-[#7fa3b0] hover:text-white'
                            }`}
                            style={nameFontSize === sz ? { backgroundColor: activeTheme.color, borderColor: activeTheme.border } : {}}
                          >
                            {sz.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Current Bid Font Size */}
                    <div className="p-3 rounded-2xl bg-[#011420] border border-[#0d3f4f] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-white font-semibold">Giant Current Bid Font Size</span>
                        <span className="text-[11px] font-mono text-amber-400 font-bold">
                          {BID_FONT_SIZE_MAP[bidFontSize].label}
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-1">
                        {(['md', 'lg', 'xl', '2xl'] as BidFontSizeId[]).map((sz) => (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => setBidFontSize(sz)}
                            className={`py-1.5 text-[11px] font-mono font-bold rounded-lg border transition-all cursor-pointer ${
                              bidFontSize === sz
                                ? 'bg-amber-400 text-amber-950 border-amber-300 shadow-sm'
                                : 'bg-[#021822] border-white/10 text-[#7fa3b0] hover:text-white'
                            }`}
                          >
                            {sz === '2xl' ? 'MONSTER' : sz.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* S.NO Serial Number Size */}
                    <div className="p-3 rounded-2xl bg-[#011420] border border-[#0d3f4f] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-white font-semibold">S.NO Serial Number Font Size</span>
                        <span className="text-[11px] font-mono text-[#00d2ee]" style={{ color: activeTheme.color }}>
                          {SNO_FONT_SIZE_MAP[snoFontSize].label}
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-1">
                        {(['sm', 'md', 'lg', 'xl'] as SnoFontSizeId[]).map((sz) => (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => setSnoFontSize(sz)}
                            className={`py-1.5 text-[11px] font-mono font-bold rounded-lg border transition-all cursor-pointer ${
                              snoFontSize === sz
                                ? 'bg-[#00d2ee] text-[#02131b] border-[#00d2ee] shadow-sm'
                                : 'bg-[#021822] border-white/10 text-[#7fa3b0] hover:text-white'
                            }`}
                            style={snoFontSize === sz ? { backgroundColor: activeTheme.color, borderColor: activeTheme.border } : {}}
                          >
                            {sz.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Badges Size & Controls Size */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 rounded-2xl bg-[#011420] border border-[#0d3f4f] space-y-1.5">
                        <span className="text-[11px] font-mono text-white font-semibold block">Badges & Tags Size</span>
                        <div className="grid grid-cols-3 gap-1">
                          {(['sm', 'md', 'lg'] as BadgesSizeId[]).map((sz) => (
                            <button
                              key={sz}
                              type="button"
                              onClick={() => setBadgesSize(sz)}
                              className={`py-1 text-[10px] font-mono font-bold rounded transition-all cursor-pointer ${
                                badgesSize === sz
                                  ? 'bg-[#00d2ee] text-[#02131b]'
                                  : 'bg-[#021822] text-[#7fa3b0] hover:text-white'
                              }`}
                              style={badgesSize === sz ? { backgroundColor: activeTheme.color } : {}}
                            >
                              {sz.toUpperCase()}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="p-3 rounded-2xl bg-[#011420] border border-[#0d3f4f] space-y-1.5">
                        <span className="text-[11px] font-mono text-white font-semibold block">Action Buttons Size</span>
                        <div className="grid grid-cols-3 gap-1">
                          {(['sm', 'md', 'lg'] as ControlsSizeId[]).map((sz) => (
                            <button
                              key={sz}
                              type="button"
                              onClick={() => setControlsSize(sz)}
                              className={`py-1 text-[10px] font-mono font-bold rounded transition-all cursor-pointer ${
                                controlsSize === sz
                                  ? 'bg-[#00d2ee] text-[#02131b]'
                                  : 'bg-[#021822] text-[#7fa3b0] hover:text-white'
                              }`}
                              style={controlsSize === sz ? { backgroundColor: activeTheme.color } : {}}
                            >
                              {sz.toUpperCase()}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* 5. TEAMS Column-Wise Arrangement & Size Options */}
                    <div className="space-y-3 pt-3 border-t border-[#0d3f4f]/50">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-mono text-white/90 uppercase tracking-wider font-bold flex items-center gap-1.5">
                          <IoPeopleOutline className="size-3.5 text-[#00d2ee]" style={{ color: activeTheme.color }} />
                          <span>Teams Columns Arrangement (1, 2, 3 Columns)</span>
                        </label>
                        <span className="text-[11px] font-mono font-bold text-amber-400">
                          {TEAMS_COLUMNS_MAP[teamsColumns].label}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {(['1', '2', '3'] as TeamsColumnsId[]).map((col) => (
                          <button
                            key={col}
                            type="button"
                            onClick={() => setTeamsColumns(col)}
                            className={`py-2 px-2.5 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                              teamsColumns === col
                                ? 'bg-[#00d2ee] text-[#02131b] border-[#00d2ee] shadow-sm'
                                : 'bg-[#011420] border-[#0d3f4f] text-[#7fa3b0] hover:text-white'
                            }`}
                            style={teamsColumns === col ? { backgroundColor: activeTheme.color, borderColor: activeTheme.border } : {}}
                          >
                            <LayoutGrid className="size-3.5" />
                            <span>{col} Col{col !== '1' ? 's' : ''}</span>
                          </button>
                        ))}
                      </div>

                      {/* Team Card Display Size & Density */}
                      <div className="p-3 rounded-2xl bg-[#011420] border border-[#0d3f4f] space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono text-white font-semibold">Team Card Display Size & Density</span>
                          <span className="text-[11px] font-mono text-[#00d2ee] font-bold" style={{ color: activeTheme.color }}>
                            {TEAM_CARD_SIZE_MAP[teamCardSize].label}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                          {(['sm', 'md', 'lg'] as TeamCardSizeId[]).map((sz) => (
                            <button
                              key={sz}
                              type="button"
                              onClick={() => setTeamCardSize(sz)}
                              className={`py-1.5 text-xs font-mono font-bold rounded-lg border transition-all cursor-pointer text-center ${
                                teamCardSize === sz
                                  ? 'bg-[#00d2ee] text-[#02131b] border-[#00d2ee] shadow-sm'
                                  : 'bg-[#021822] border-white/10 text-[#7fa3b0] hover:text-white'
                              }`}
                              style={teamCardSize === sz ? { backgroundColor: activeTheme.color, borderColor: activeTheme.border } : {}}
                            >
                              {TEAM_CARD_SIZE_MAP[sz].label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= TAB 2: DRAG & REORDER POSITIONS ================= */}
              {activeTab === 'reorder' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between pb-1">
                    <div>
                      <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-white">
                        Card Elements Position Hierarchy
                      </h4>
                      <p className="text-[11px] text-[#7fa3b0]">
                        Drag and drop items or click ▲ / ▼ arrows to change the vertical layout order on the Player Card.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setElementOrder(['sno', 'name', 'badges', 'bid'])}
                      className="text-[10px] font-mono text-[#00d2ee] hover:underline cursor-pointer"
                    >
                      Reset Order
                    </button>
                  </div>

                  <div className="space-y-2">
                    {elementOrder.map((elemId, idx) => {
                      const titles: Record<CardElementId, { title: string; desc: string; icon: any }> = {
                        sno: {
                          title: 'S.NO Serial Number Glowing Text',
                          desc: 'Displays S.NO #95 in glowing neon cyan',
                          icon: Sparkles,
                        },
                        name: {
                          title: 'Player Full Name (Giant Bold Font)',
                          desc: 'Displays JAYAVEER in uppercase typography',
                          icon: Type,
                        },
                        badges: {
                          title: 'Badges & Form Registration Tags',
                          desc: 'Displays Grade, Experience, Chapter, and visible form tags',
                          icon: IoPricetagOutline,
                        },
                        bid: {
                          title: 'Giant Current Bid Section (Gold Coin + Bid)',
                          desc: 'Displays Coin emblem + 1,000 + Quick Edit & Undo',
                          icon: Landmark,
                        },
                      };

                      const item = titles[elemId];
                      const Icon = item.icon;

                      return (
                        <div
                          key={elemId}
                          draggable
                          onDragStart={(e) => handleElementDragStart(e, elemId)}
                          onDragOver={(e) => {
                            e.preventDefault();
                            setDragOverElementId(elemId);
                          }}
                          onDragLeave={() => setDragOverElementId(null)}
                          onDrop={(e) => handleElementDrop(e, elemId)}
                          className={`p-3 rounded-2xl border transition-all cursor-move flex items-center justify-between gap-3 ${
                            dragOverElementId === elemId
                              ? 'bg-[#00d2ee]/20 border-[#00d2ee] ring-2 ring-[#00d2ee]'
                              : 'bg-[#011420] hover:bg-[#021822] border-[#0d3f4f]'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Drag handle */}
                            <div className="text-white/40 hover:text-white cursor-grab active:cursor-grabbing p-1">
                              <Move className="size-4" />
                            </div>

                            <span className="size-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-mono font-bold text-white shrink-0">
                              #{idx + 1}
                            </span>

                            <div className="size-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#00d2ee] shrink-0">
                              <Icon className="size-4" />
                            </div>

                            <div className="min-w-0">
                              <span className="text-xs font-mono font-bold text-white block truncate">
                                {item.title}
                              </span>
                              <span className="text-[10px] text-[#7fa3b0] block truncate">
                                {item.desc}
                              </span>
                            </div>
                          </div>

                          {/* Up & Down Arrows */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => handleMoveElement(elemId, 'up')}
                              className="size-7 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-white disabled:opacity-20 flex items-center justify-center transition-all cursor-pointer"
                              title="Move Up"
                            >
                              <ChevronUp className="size-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === elementOrder.length - 1}
                              onClick={() => handleMoveElement(elemId, 'down')}
                              className="size-7 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-white disabled:opacity-20 flex items-center justify-center transition-all cursor-pointer"
                              title="Move Down"
                            >
                              <ChevronDown className="size-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Under-photo Pills toggle */}
                  <div className="p-3 rounded-2xl bg-[#011420] border border-[#0d3f4f] flex items-center justify-between gap-3 mt-4">
                    <div>
                      <span className="text-xs font-mono font-bold text-white block">
                        Under-Photo Pills (Age & Gender)
                      </span>
                      <span className="text-[10px] text-[#7fa3b0] block">
                        Show [10 Years] and [Gender: optA] pills directly underneath the photo
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPillsUnderPhoto(!showPillsUnderPhoto)}
                      className={`px-3 py-1 rounded-full text-xs font-mono font-bold border transition-all cursor-pointer ${
                        showPillsUnderPhoto
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                          : 'bg-white/5 text-white/40 border-white/10'
                      }`}
                    >
                      {showPillsUnderPhoto ? 'VISIBLE' : 'HIDDEN'}
                    </button>
                  </div>
                </div>
              )}

              {/* ================= TAB 3: VISIBLE PLAYER REGISTRATION FIELDS ================= */}
              {activeTab === 'fields' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between pb-1 border-b border-[#0d3f4f]/50">
                    <div>
                      <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-white">
                        Tournament Player Form Fields
                      </h4>
                      <p className="text-[11px] text-[#7fa3b0]">
                        Turn ON to show on auction card, OFF to hide. Drag to arrange order.
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleToggleAllFields(true)}
                        className="px-2 py-1 text-[10px] font-mono rounded bg-white/5 hover:bg-white/10 border border-white/10 text-emerald-400 cursor-pointer"
                      >
                        All ON
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleAllFields(false)}
                        className="px-2 py-1 text-[10px] font-mono rounded bg-white/5 hover:bg-white/10 border border-white/10 text-rose-400 cursor-pointer"
                      >
                        All OFF
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {fields.length === 0 ? (
                      <div className="p-8 text-center text-xs font-mono text-[#7fa3b0] border border-dashed border-[#0d3f4f] rounded-2xl">
                        Loading tournament form fields...
                      </div>
                    ) : (
                      fields.map((f, idx) => (
                        <div
                          key={f.key}
                          draggable
                          onDragStart={(e) => handleFieldDragStart(e, f.key)}
                          onDragOver={(e) => {
                            e.preventDefault();
                            setDragOverFieldKey(f.key);
                          }}
                          onDragLeave={() => setDragOverFieldKey(null)}
                          onDrop={(e) => handleFieldDrop(e, f.key)}
                          className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2.5 ${
                            dragOverFieldKey === f.key
                              ? 'bg-[#00d2ee]/20 border-[#00d2ee] ring-2 ring-[#00d2ee]'
                              : f.visible
                              ? 'bg-[#011420] border-[#0d3f4f] hover:border-[#00d2ee]/50'
                              : 'bg-[#010e17] border-white/5 opacity-50 hover:opacity-80'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {/* Drag handle */}
                            <div className="text-white/30 hover:text-white cursor-grab p-0.5">
                              <Move className="size-3.5" />
                            </div>

                            {/* Up / Down arrows */}
                            <div className="flex flex-col gap-0.5">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleMoveField(f.key, 'up')}
                                className="text-white/40 hover:text-white disabled:opacity-20 cursor-pointer p-0.5"
                                title="Move Up"
                              >
                                <ChevronUp size={11} />
                              </button>
                              <button
                                type="button"
                                disabled={idx === fields.length - 1}
                                onClick={() => handleMoveField(f.key, 'down')}
                                className="text-white/40 hover:text-white disabled:opacity-20 cursor-pointer p-0.5"
                                title="Move Down"
                              >
                                <ChevronDown size={11} />
                              </button>
                            </div>

                            <span className="text-[10px] font-mono text-white/30 shrink-0">#{idx + 1}</span>

                            <div className="min-w-0">
                              <span className="text-xs font-mono font-bold text-white block truncate">
                                {f.label}
                              </span>
                              <span className="text-[10px] font-mono text-[#7fa3b0] block truncate">
                                Value: <b className="text-white/90">{getFieldDemoValue(f)}</b>
                              </span>
                            </div>
                          </div>

                          {/* Toggle ON / OFF Button */}
                          <button
                            type="button"
                            onClick={() => handleToggleField(f.key)}
                            className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold transition-all cursor-pointer border flex items-center gap-1.5 shrink-0 ${
                              f.visible
                                ? 'shadow-sm'
                                : 'bg-white/5 text-white/40 border-white/10 hover:text-white'
                            }`}
                            style={
                              f.visible
                                ? {
                                    backgroundColor: activeTheme.bgLight,
                                    borderColor: activeTheme.border,
                                    color: activeTheme.color,
                                  }
                                : {}
                            }
                          >
                            {f.visible ? (
                              <>
                                <Eye size={12} />
                                <span>ON</span>
                              </>
                            ) : (
                              <>
                                <EyeOff size={12} />
                                <span>OFF</span>
                              </>
                            )}
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* ================= TAB 4: THEME & ARENA AMBIENCE ================= */}
              {activeTab === 'theme' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div>
                    <label className="text-xs font-mono text-white/90 uppercase tracking-wider font-bold block mb-2">
                      Tournament Accent Theme Preset
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {THEME_PRESETS.map((t) => {
                        const isSelected = themeColor === t.id;
                        return (
                          <div
                            key={t.id}
                            onClick={() => setThemeColor(t.id)}
                            className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                              isSelected
                                ? 'bg-[#021822] border-[#00d2ee] shadow-[0_0_15px_rgba(0,210,238,0.3)]'
                                : 'bg-[#011420] border-[#0d3f4f] opacity-70 hover:opacity-100'
                            }`}
                            style={isSelected ? { borderColor: t.border } : {}}
                          >
                            <div className="flex items-center gap-2.5">
                              <span
                                className="size-4 rounded-full border shadow-sm shrink-0"
                                style={{
                                  backgroundColor: t.color,
                                  borderColor: t.border,
                                  boxShadow: `0 0 10px ${t.glow}`,
                                }}
                              />
                              <div>
                                <span className="text-xs font-mono font-bold text-white block">{t.label}</span>
                                <span className="text-[10px] font-mono text-white/50">{t.color}</span>
                              </div>
                            </div>
                            {isSelected && <Check className="size-4" style={{ color: t.color }} />}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Ambience Background */}
                  <div className="pt-2 border-t border-[#0d3f4f]/50">
                    <label className="text-xs font-mono text-white/90 uppercase tracking-wider font-bold block mb-2">
                      Arena Atmosphere Background
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'stadium_floodlights', label: 'Stadium Floodlights' },
                        { id: 'cyber_grid', label: 'Cyber Hex Grid' },
                        { id: 'dark_arena', label: 'Deep Cosmic Onyx' },
                        { id: 'gradient', label: 'Radial Spotlight' },
                      ].map((bg) => (
                        <div
                          key={bg.id}
                          onClick={() => setBackgroundStyle(bg.id as BackgroundStyleId)}
                          className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer text-xs font-mono font-bold ${
                            backgroundStyle === bg.id
                              ? 'bg-[#021822] border-[#00d2ee] text-white shadow-sm'
                              : 'bg-[#011420] border-[#0d3f4f] text-[#7fa3b0] hover:text-white'
                          }`}
                          style={backgroundStyle === bg.id ? { borderColor: activeTheme.border } : {}}
                        >
                          {bg.label}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ================= TAB 5: WIDGETS & OVERLAYS ================= */}
              {activeTab === 'widgets' && (
                <div className="space-y-2.5 animate-in fade-in duration-150">
                  {[
                    {
                      key: 'purses',
                      title: 'Franchise Team Purse Balances',
                      desc: 'Show remaining coin balance and squad slot counts on the Teams panel',
                      checked: showTeamPurses,
                      setter: setShowTeamPurses,
                    },
                    {
                      key: 'bids',
                      title: 'Live Bids Audit History Ticker',
                      desc: 'Show realtime bid updates feed with timestamps and increments',
                      checked: showBidTicker,
                      setter: setShowBidTicker,
                    },
                    {
                      key: 'sponsors',
                      title: 'Tournament Sponsor Brand Bar',
                      desc: 'Display sponsor banner ticker at the bottom of the arena',
                      checked: showSponsors,
                      setter: setShowSponsors,
                    },
                    {
                      key: 'sound',
                      title: 'Sound & Gavel Hammer Indicator',
                      desc: 'Play sound effects during gavel actions and sold bids',
                      checked: showSoundEffects,
                      setter: setShowSoundEffects,
                    },
                  ].map((widget) => (
                    <div
                      key={widget.key}
                      onClick={() => widget.setter(!widget.checked)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        widget.checked
                          ? 'bg-[#021822] border-[#0d3f4f]'
                          : 'bg-[#011420] border-[#0d3f4f]/40 opacity-60 hover:opacity-100'
                      }`}
                      style={widget.checked ? { borderColor: `${activeTheme.border}80` } : {}}
                    >
                      <div>
                        <span className="text-xs font-mono font-bold text-white block">{widget.title}</span>
                        <span className="text-[11px] text-[#7fa3b0] block mt-0.5">{widget.desc}</span>
                      </div>
                      <div
                        className={`size-5 rounded-md border flex items-center justify-center shrink-0 ${
                          widget.checked ? 'bg-[#00d2ee] text-[#02131b]' : 'bg-transparent border-[#0d3f4f]'
                        }`}
                        style={widget.checked ? { backgroundColor: activeTheme.color } : {}}
                      >
                        {widget.checked && <Check size={14} className="stroke-[3]" />}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Drawer Fixed Footer */}
            <div className="p-3.5 border-t border-[#0d3f4f] bg-[#021826] flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsEditDrawerOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-mono text-[#7fa3b0] hover:text-white hover:bg-white/5 transition-all cursor-pointer"
              >
                Hide Panel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-[#02131b] transition-all cursor-pointer shadow-lg active:scale-95 disabled:opacity-50"
                style={{
                  backgroundColor: activeTheme.color,
                  boxShadow: `0 0 20px ${activeTheme.glow}`,
                }}
              >
                {saving ? (
                  <>
                    <RefreshCw className="size-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="size-4 stroke-[3]" />
                    <span>Save & Publish</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ===================== MAIN CANVAS: FULL PAGE LIVE AUCTION (100% WIDTH) ===================== */}
        <div className="flex-1 min-h-0 flex flex-col justify-between bg-[#010e17] p-2 sm:p-3 overflow-hidden relative">
          {/* Quick Simulation Testing Pill Bar */}
          <div className="flex items-center justify-between pb-2 border-b border-[#0d3f4f]/60 shrink-0 gap-2 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="text-[#00d2ee] font-bold uppercase">Auction Stage:</span>
              <span className="text-white/80">{previewPlayer.name} on block</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSimulatedBid((prev) => prev + 1000)}
                className="px-2.5 py-1 text-[11px] font-mono rounded-lg border transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                style={{
                  backgroundColor: activeTheme.bgLight,
                  borderColor: activeTheme.border,
                  color: activeTheme.color,
                }}
                title="Simulate +1,000 Bid Up"
              >
                <IoFlashOutline className="size-3" />
                <span>+1,000</span>
              </button>
              <button
                type="button"
                onClick={() => setSimulatedBid((prev) => prev + 5000)}
                className="px-2.5 py-1 text-[11px] font-mono rounded-lg border transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                style={{
                  backgroundColor: activeTheme.bgLight,
                  borderColor: activeTheme.border,
                  color: activeTheme.color,
                }}
                title="Simulate +5,000 Bid Up"
              >
                <IoFlashOutline className="size-3" />
                <span>+5,000</span>
              </button>
              <button
                type="button"
                onClick={() => setSimulatedBid(previewPlayer.basePrice || 1000)}
                className="p-1 rounded-lg text-[#7fa3b0] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                title="Reset Bid to Base Price"
              >
                <IoRefreshOutline className="size-3.5" />
              </button>
            </div>
          </div>

          {/* ================= CONDITION 1: OVERALL ARENA PREVIEW (MATCHING USER SCREENSHOT) ================= */}
          {previewTarget === 'overall' && (
            <div className="flex-1 flex flex-col justify-between gap-2.5 bg-[#010e17] rounded-2xl relative overflow-hidden pt-1">
              {/* Ambience Overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#00d2ee]/5 via-transparent to-black/60 pointer-events-none" />

              {/* 2. MAIN WORKSPACE (GRID WITH CUSTOMIZED ARENA SPLIT) */}
              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0 items-stretch overflow-hidden">
                  {/* LEFT CARD: ACTIVE PLAYER ON BLOCK */}
                  <div
                    className={`${ARENA_SPLIT_MAP[arenaSplit].leftClass} bg-[#02131b]/95 border border-[#0d3f4f] rounded-2xl p-3 sm:p-4 shadow-xl flex flex-col justify-between overflow-hidden`}
                  >
                    <div
                      className={`grid grid-cols-1 md:grid-cols-12 gap-3 items-stretch h-full ${
                        photoPosition === 'right' ? 'flex-row-reverse' : ''
                      }`}
                    >
                      {/* Sub-Column 1: Player Photo + Pills */}
                      <div
                        className={`${CARD_SPLIT_MAP[playerCardSplit].photoClass} ${
                          photoPosition === 'right' ? 'md:order-2' : 'md:order-1'
                        } flex flex-col justify-between gap-2 h-full`}
                      >
                        <div
                          className={`relative w-full rounded-xl overflow-hidden bg-[#011420] border-2 border-[#0d3f4f] shadow-md ${
                            photoAspect === 'square'
                              ? 'aspect-square'
                              : photoAspect === 'tall'
                              ? 'aspect-[4/5]'
                              : 'flex-1'
                          }`}
                        >
                          <img
                            src={previewPlayer.profileImage || 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=600'}
                            alt={previewPlayer.name}
                            className="size-full object-cover"
                          />
                        </div>

                        {/* Under-photo Pills */}
                        {showPillsUnderPhoto && (
                          <div className="grid grid-cols-2 gap-1.5 shrink-0">
                            <div className="py-1.5 px-2 rounded-lg bg-[#011420] border border-[#0d3f4f] text-center text-xs font-mono font-bold text-white tracking-wide truncate">
                              10 Years
                            </div>
                            <div className="py-1.5 px-2 rounded-lg bg-[#011420] border border-[#0d3f4f] text-center text-xs font-mono font-bold text-white tracking-wide truncate">
                              Gender: optA
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Sub-Column 2: Dynamic Element Order (S.NO, Name, Badges, Giant Bid) */}
                      <div
                        className={`${CARD_SPLIT_MAP[playerCardSplit].detailsClass} ${
                          photoPosition === 'right' ? 'md:order-1' : 'md:order-2'
                        } flex flex-col justify-between py-0.5 h-full min-w-0`}
                      >
                        <div className="space-y-2.5">
                          {elementOrder.map((elemId) => {
                            if (elemId === 'sno') {
                              return (
                                <div
                                  key="sno"
                                  className={`${SNO_FONT_SIZE_MAP[snoFontSize].class} font-black font-mono tracking-wide uppercase drop-shadow-[0_0_15px_rgba(0,210,238,0.65)]`}
                                  style={{ color: activeTheme.color }}
                                >
                                  S.NO #{previewPlayer.playerCode || '95'}
                                </div>
                              );
                            }

                            if (elemId === 'name') {
                              return (
                                <div key="name" className="w-full overflow-hidden">
                                  <AutoScrollText
                                    text={previewPlayer.name}
                                    className={`${NAME_FONT_SIZE_MAP[nameFontSize].class} font-black font-sans uppercase tracking-wider text-white leading-tight`}
                                  />
                                </div>
                              );
                            }

                            if (elemId === 'badges') {
                              return (
                                <div key="badges" className="space-y-1.5 pt-0.5">
                                  {/* Badges Row */}
                                  <div className="flex flex-wrap items-center gap-2">
                                    {/* Orange minus button */}
                                    <button
                                      type="button"
                                      className="size-8 rounded-lg bg-[#ff5500] text-white font-black flex items-center justify-center text-base shadow-sm"
                                    >
                                      -
                                    </button>

                                    {/* Visible Form Fields Badges */}
                                    {fields
                                      .filter((f) => f.visible && !['name', 'playerName'].includes(f.key))
                                      .map((f) => (
                                        <div
                                          key={f.key}
                                          className={`inline-flex items-center gap-1.5 rounded-xl border font-mono font-bold shadow-sm ${BADGES_SIZE_MAP[badgesSize].badgeClass} ${
                                            f.key.toLowerCase().includes('role')
                                              ? 'bg-[#021c29] border-[#00d2ee]/60 text-[#00d2ee]'
                                              : f.key.toLowerCase().includes('experience')
                                              ? 'bg-[#78350f]/80 border-amber-600/50 text-[#fed7aa]'
                                              : 'bg-emerald-950/40 border-emerald-500/50 text-emerald-400'
                                          }`}
                                        >
                                          <IoPricetagOutline className={BADGES_SIZE_MAP[badgesSize].iconClass} />
                                          <span>{getFieldDemoValue(f)}</span>
                                          {f.key.toLowerCase().includes('role') && (
                                            <Pencil className="size-3 text-[#00d2ee]/70 ml-0.5" />
                                          )}
                                        </div>
                                      ))}
                                  </div>
                                </div>
                              );
                            }

                            if (elemId === 'bid') {
                              return (
                                <div key="bid" className="mt-3 flex items-center gap-3 shrink-0">
                                  {/* Golden Coin Icon */}
                                  <div className="size-12 sm:size-14 rounded-full bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 border-2 border-yellow-200 shadow-[0_0_20px_rgba(245,158,11,0.65)] flex items-center justify-center text-amber-950 font-black shrink-0">
                                    <Landmark className="size-6 sm:size-7 text-amber-950" />
                                  </div>

                                  {/* Giant Bid Amount */}
                                  <div
                                    className={`${BID_FONT_SIZE_MAP[bidFontSize].class} font-black font-mono tracking-tight drop-shadow-[0_0_20px_rgba(0,210,238,0.7)] flex-1 min-w-0 truncate`}
                                    style={{ color: activeTheme.color }}
                                  >
                                    {simulatedBid.toLocaleString()}
                                  </div>

                                  {/* Edit pencil button */}
                                  <div className="size-10 rounded-xl bg-[#031d27] border border-[#00d2ee]/50 text-[#00d2ee] flex items-center justify-center shadow-sm">
                                    <Pencil className="size-4" />
                                  </div>

                                  {/* Undo button */}
                                  <div className="size-10 rounded-xl bg-[#031d27] border border-rose-500/50 text-rose-400 flex items-center justify-center shadow-sm">
                                    <Undo2 className="size-4" />
                                  </div>
                                </div>
                              );
                            }

                            return null;
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT CARD: TEAMS (ACCORDING TO ARENA SPLIT) */}
                  <div
                    className={`${ARENA_SPLIT_MAP[arenaSplit].rightClass} bg-[#02131b]/95 border border-[#0d3f4f] rounded-2xl p-3 shadow-xl flex flex-col justify-between overflow-hidden`}
                  >
                    <div className="flex flex-col h-full overflow-hidden">
                      {/* Card Header */}
                      <div className="flex items-center justify-between pb-2 border-b border-[#0d3f4f] shrink-0 mb-2">
                        <span className="text-xs font-mono font-bold tracking-wider uppercase text-[#00d2ee]">
                          TEAMS ({teamsList.length})
                        </span>
                        <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-amber-500">
                          BIDDING TEAM SELECTION
                        </span>
                      </div>

                      {/* Teams List (2 Columns x 3 Rows) */}
                      <div className={`${TEAMS_COLUMNS_MAP[teamsColumns].gridClass} overflow-y-auto custom-scrollbar flex-1 pr-0.5`}>
                        {teamsList.map((team, idx) => {
                          const sizeCfg = TEAM_CARD_SIZE_MAP[teamCardSize];
                          const isFull = team.playersCount >= team.maxPlayers;
                          const slotsLeft = Math.max(0, team.maxPlayers - team.playersCount);
                          return (
                            <div
                              key={team._id || idx}
                              className={`h-auto w-full self-start shrink-0 ${sizeCfg.cardPad} rounded-xl border transition-all flex items-center gap-2 ${
                                idx === 0
                                  ? 'bg-[#00d2ee]/15 border-[#00d2ee] shadow-[0_0_12px_rgba(0,210,238,0.3)] ring-1 ring-[#00d2ee]'
                                  : 'bg-[#011622] border-[#0d3f4f] hover:border-[#00d2ee]/40'
                              }`}
                            >
                              <div className={`${sizeCfg.logoSize} rounded-full overflow-hidden border border-white/20 bg-[#010e17] shrink-0 flex items-center justify-center`}>
                                <img
                                  src={team.logo || 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=100'}
                                  alt={team.name}
                                  className="size-full object-cover"
                                />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                  <div className="flex-1 min-w-0 mr-1">
                                    <AutoScrollText
                                      text={team.name}
                                      className={`${sizeCfg.nameClass} font-sans text-white`}
                                    />
                                  </div>
                                  <Eye className="size-3 text-[#7fa3b0] shrink-0" />
                                </div>

                                <div className="flex items-center justify-between gap-1 mt-0.5">
                                  <div className="flex items-center gap-1 min-w-0">
                                    <div className={`${sizeCfg.coinSize} rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 border border-yellow-200 flex items-center justify-center shrink-0`}>
                                      <Landmark className="size-2 text-amber-950" />
                                    </div>
                                    <span className={`${sizeCfg.purseClass} font-mono text-amber-400 truncate`}>
                                      {formatPurseShort(team.purseRemaining)}
                                    </span>
                                  </div>
                                  {isFull && (
                                    <span className="px-1 rounded text-[8px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 uppercase shrink-0">
                                      Full
                                    </span>
                                  )}
                                </div>

                                <div className={`flex items-center justify-between font-mono mt-0.5 text-[#7fa3b0] ${sizeCfg.squadClass}`}>
                                  <span>Squad: {team.playersCount}/{team.maxPlayers}</span>
                                  <span className={isFull ? 'text-rose-400' : 'text-emerald-400 font-medium'}>
                                    Left: {slotsLeft}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. ARENA BOTTOM ACTION DECK & STATS (MATCHING USER SCREENSHOT) */}
                <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-2 border-t border-[#0d3f4f]/60 shrink-0">
                  {/* Left: Action Control Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* New Player Mode Toggle */}
                    <div className="p-1 rounded-xl bg-[#011420] border border-[#0d3f4f] flex items-center gap-1.5 shadow-inner">
                      <div className="flex flex-col px-1">
                        <span className="text-[8px] font-mono font-bold text-[#7fa3b0] uppercase text-center">
                          NEW PLAYER MODE
                        </span>
                        <div className="flex items-center gap-1 mt-0.5">
                          <button
                            type="button"
                            onClick={() => setSimulatedMode('RANDOM')}
                            className={`px-2 py-1 rounded text-[10px] font-mono font-bold flex items-center gap-1 ${
                              simulatedMode === 'RANDOM'
                                ? 'bg-[#00d2ee] text-[#02131b]'
                                : 'text-[#7fa3b0] hover:text-white'
                            }`}
                          >
                            <Shuffle className="size-3" />
                            <span>Random</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSimulatedMode('MANUAL')}
                            className={`px-2 py-1 rounded text-[10px] font-mono font-bold flex items-center gap-1 ${
                              simulatedMode === 'MANUAL'
                                ? 'bg-[#00d2ee] text-[#02131b]'
                                : 'text-[#7fa3b0] hover:text-white'
                            }`}
                          >
                            <List className="size-3" />
                            <span>Manual</span>
                          </button>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSamplePlayerIndex((prev) => prev + 1)}
                        className="px-3.5 py-2 rounded-lg bg-[#c25e1a] hover:bg-[#d8691f] text-white text-xs font-mono font-bold shadow-md cursor-pointer"
                        title="Simulate calling next player"
                      >
                        New Player
                      </button>
                    </div>

                    {/* + Bid Up */}
                    <button
                      type="button"
                      onClick={() => setSimulatedBid((prev) => prev + 1000)}
                      className={`rounded-xl bg-[#031d27] border border-[#00d2ee]/60 text-[#00d2ee] font-mono font-bold transition-all shadow-sm ${CONTROLS_SIZE_MAP[controlsSize].btnClass}`}
                    >
                      + Bid Up
                    </button>

                    {/* — Bid Down */}
                    <button
                      type="button"
                      onClick={() => setSimulatedBid((prev) => Math.max(1000, prev - 1000))}
                      className={`rounded-xl bg-[#031d27] border border-[#00d2ee]/60 text-[#00d2ee] font-mono font-bold transition-all shadow-sm ${CONTROLS_SIZE_MAP[controlsSize].btnClass}`}
                    >
                      — Bid Down
                    </button>

                    {/* Sold */}
                    <button
                      type="button"
                      className={`rounded-xl bg-[#031d27] border border-white/20 text-white/60 font-mono font-bold flex items-center gap-1.5 shadow-sm ${CONTROLS_SIZE_MAP[controlsSize].btnClass}`}
                    >
                      <Gavel className="size-3.5" />
                      <span>Sold</span>
                    </button>

                    {/* Unsold */}
                    <button
                      type="button"
                      className={`rounded-xl bg-[#ff1744] text-white font-mono font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(255,23,68,0.45)] ${CONTROLS_SIZE_MAP[controlsSize].btnClass}`}
                    >
                      <X className="size-3.5" />
                      <span>Unsold</span>
                    </button>
                  </div>

                  {/* Right: 2x2 Metric Badges */}
                  <div className="grid grid-cols-2 gap-1.5 shrink-0">
                    <div className="px-4 py-1.5 rounded-lg bg-[#142e20] border border-emerald-600/50 text-emerald-400 text-center text-xs font-mono font-bold min-w-[100px]">
                      Sold 0
                    </div>
                    <div className="px-4 py-1.5 rounded-lg bg-[#0c1f30] border border-[#0d3f4f] text-[#7fa3b0] text-center text-xs font-mono font-bold min-w-[100px]">
                      Available 1
                    </div>
                    <div className="px-4 py-1.5 rounded-lg bg-[#2e0e18] border border-rose-600/50 text-rose-400 text-center text-xs font-mono font-bold min-w-[100px]">
                      Unsold 0
                    </div>
                    <div className="px-4 py-1.5 rounded-lg bg-[#162029] border border-white/10 text-white/90 text-center text-xs font-mono font-bold min-w-[100px]">
                      Team 2
                    </div>
                  </div>
                </div>

                {/* 4. ARENA LIVE TICKER BAR */}
                {showBidTicker && (
                  <div className="relative z-10 py-1.5 px-3 bg-[#001018] border-t border-[#0d3f4f] flex items-center gap-2.5 text-xs font-mono shrink-0 rounded-b-xl mt-1">
                    <div className="size-4 rounded-full bg-amber-500 text-amber-950 font-bold flex items-center justify-center text-[9px] shrink-0">
                      N
                    </div>
                    <span className="text-[#00d2ee] font-bold tracking-wider uppercase shrink-0 text-[11px]">LIVE TICKER:</span>
                    <div className="flex-1 overflow-hidden">
                      <AutoScrollText
                        text={`On Block: ${previewPlayer.name} • Base: ₹${(previewPlayer.basePrice || 1000).toLocaleString()} • Current Bid: ₹${simulatedBid.toLocaleString()} • Chapter: Mangalagiri`}
                        className="text-[#7fa3b0] text-[11px]"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ================= CONDITION 2: PLAYER CARD FOCUS VIEW ================= */}
            {previewTarget === 'player' && (
              <div className="flex-1 flex flex-col justify-center items-center p-4">
                <div
                  className="w-full max-w-2xl bg-[#02131b] border-2 rounded-3xl p-6 shadow-2xl space-y-4"
                  style={{
                    borderColor: activeTheme.border,
                    boxShadow: `0 0 30px ${activeTheme.glow}`,
                  }}
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <span className="text-xs font-mono text-[#7fa3b0] uppercase tracking-wider">
                      PLAYER CARD PREVIEW (FOCUS)
                    </span>
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase"
                      style={{ backgroundColor: activeTheme.bgLight, color: activeTheme.color }}
                    >
                      {activeTheme.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    <div className="md:col-span-5 flex flex-col gap-2">
                      <div className="relative aspect-square rounded-2xl overflow-hidden border-2 border-white/20 bg-[#011420]">
                        <img
                          src={previewPlayer.profileImage || 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=600'}
                          alt={previewPlayer.name}
                          className="size-full object-cover"
                        />
                      </div>
                      {showPillsUnderPhoto && (
                        <div className="grid grid-cols-2 gap-1.5">
                          <div className="p-1.5 text-center text-xs font-mono font-bold bg-[#011420] border border-[#0d3f4f] rounded-lg">
                            10 Years
                          </div>
                          <div className="p-1.5 text-center text-xs font-mono font-bold bg-[#011420] border border-[#0d3f4f] rounded-lg">
                            Gender: optA
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="md:col-span-7 space-y-3">
                      <div
                        className={`${SNO_FONT_SIZE_MAP[snoFontSize].class} font-black font-mono`}
                        style={{ color: activeTheme.color }}
                      >
                        S.NO #{previewPlayer.playerCode || '95'}
                      </div>
                      <div className="w-full overflow-hidden">
                        <AutoScrollText
                          text={previewPlayer.name}
                          className={`${NAME_FONT_SIZE_MAP[nameFontSize].class} font-black uppercase text-white`}
                        />
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {fields
                          .filter((f) => f.visible && !['name', 'playerName'].includes(f.key))
                          .map((f) => (
                            <span
                              key={f.key}
                              className={`rounded-xl border font-mono font-bold ${BADGES_SIZE_MAP[badgesSize].badgeClass} bg-[#021c29] border-[#00d2ee]/50 text-[#00d2ee]`}
                            >
                              {getFieldDemoValue(f)}
                            </span>
                          ))}
                      </div>
                      <div className="pt-2 flex items-center gap-3">
                        <div className="size-12 rounded-full bg-amber-400 flex items-center justify-center text-amber-950 font-black">
                          <Landmark className="size-6 text-amber-950" />
                        </div>
                        <div
                          className={`${BID_FONT_SIZE_MAP[bidFontSize].class} font-black font-mono`}
                          style={{ color: activeTheme.color }}
                        >
                          {simulatedBid.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ================= CONDITION 3: TEAM ROSTER PREVIEW ================= */}
            {previewTarget === 'team' && (
              <div className="flex-1 flex flex-col justify-start p-4 space-y-4">
                {/* Team selector buttons */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                  {teamsList.map((t, idx) => (
                    <button
                      key={t._id || idx}
                      type="button"
                      onClick={() => setSelectedTeamIndex(idx)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer flex items-center gap-2 border whitespace-nowrap ${
                        selectedTeamIndex === idx
                          ? 'font-bold shadow-md'
                          : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                      }`}
                      style={
                        selectedTeamIndex === idx
                          ? {
                              backgroundColor: activeTheme.bgLight,
                              borderColor: activeTheme.border,
                              color: activeTheme.color,
                            }
                          : {}
                      }
                    >
                      <img
                        src={t.logo || 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=100'}
                        alt={t.name}
                        className="size-4 rounded-full object-cover"
                      />
                      <span>{t.name}</span>
                    </button>
                  ))}
                </div>

                {/* Team Card Showcase */}
                <div
                  className="p-5 rounded-2xl bg-[#02131b] border-2 shadow-xl space-y-4"
                  style={{ borderColor: activeTheme.border }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={activeSelectedTeam.logo || 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=200'}
                        alt={activeSelectedTeam.name}
                        className="size-16 rounded-2xl object-cover border border-white/20"
                      />
                      <div>
                        <span className="text-xs font-mono text-[#7fa3b0]">TEAM ROSTER PREVIEW</span>
                        <h3 className="text-2xl font-mono uppercase font-bold text-white">
                          {activeSelectedTeam.name}
                        </h3>
                        <span className="text-xs font-mono text-amber-400">
                          Purse Remaining: {formatPurseShort(activeSelectedTeam.purseRemaining)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono text-[#7fa3b0] block">Squad Count</span>
                      <span className="text-xl font-mono font-bold text-white">
                        {activeSelectedTeam.playersCount} / {activeSelectedTeam.maxPlayers}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
