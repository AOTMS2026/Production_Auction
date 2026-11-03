import {
  Auction,
  AuctionItem,
  ApiResponse,
  AccessRequest,
  AdminMetrics,
  SportType,
  AuctionVisibility,
  AuctionStatus,
  Team,
  Player,
  FormField,
  FormTemplate,
  TeamFormConfig,
  FormSubmission,
  Sponsor,
  FormType,
} from '@/types/auction';

export * from '@/types/auction';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  profileImage: string;
  role: 'USER' | 'ADMIN';
  isEmailVerified: boolean;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  email?: string;
  requiresVerification?: boolean;
  expiryMinutes?: number;
  user?: UserProfile;
  tokens?: {
    accessToken: string;
    refreshToken: string;
  };
}

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return (
    localStorage.getItem('aotms_access_token') ||
    localStorage.getItem('lotvault_access_token') ||
    null
  );
}

export function getStoredUser(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  const userStr =
    localStorage.getItem('aotms_user') ||
    localStorage.getItem('lotvault_user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

export function saveStoredAuth(
  tokens?: { accessToken: string; refreshToken?: string },
  user?: UserProfile
) {
  if (typeof window === 'undefined') return;
  if (tokens?.accessToken) {
    localStorage.setItem('aotms_access_token', tokens.accessToken);
    localStorage.setItem('lotvault_access_token', tokens.accessToken);
  }
  if (user) {
    const userStr = JSON.stringify(user);
    localStorage.setItem('aotms_user', userStr);
    localStorage.setItem('lotvault_user', userStr);
  }
}

export function clearStoredAuth() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('aotms_access_token');
  localStorage.removeItem('lotvault_access_token');
  localStorage.removeItem('aotms_user');
  localStorage.removeItem('lotvault_user');
}

export async function checkBackendHealth(): Promise<{ status: string; uptime: number } | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/health`, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('Failed to connect to backend:', err);
    return null;
  }
}

// ======================= AUCTION MANAGEMENT APIS =======================

export interface AuctionFilterQuery {
  sport?: string;
  visibility?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export async function getAuctions(
  filters: AuctionFilterQuery = {},
  token?: string
): Promise<{ items: Auction[]; pagination?: any }> {
  try {
    const params = new URLSearchParams();
    if (filters.sport) params.set('sport', filters.sport);
    if (filters.visibility) params.set('visibility', filters.visibility);
    if (filters.status) params.set('status', filters.status);
    if (filters.search) params.set('search', filters.search);
    if (filters.page) params.set('page', String(filters.page));
    if (filters.limit) params.set('limit', String(filters.limit));
    if (filters.sortBy) params.set('sortBy', filters.sortBy);
    if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);

    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE_URL}/api/v1/auctions?${params.toString()}`, {
      headers,
      cache: 'no-store',
    });

    if (!res.ok) throw new Error('Failed to fetch auctions');
    const json = await res.json();
    return {
      items: json.data || [],
      pagination: json.pagination,
    };
  } catch (err) {
    console.error('getAuctions error:', err);
    return { items: [] };
  }
}

export async function getAuctionById(
  id: string,
  token?: string
): Promise<{ success: boolean; data?: Auction; canAccess?: boolean; message?: string; accessStatus?: string }> {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}/api/v1/auctions/${id}`, {
    headers,
    cache: 'no-store',
  });

  const json = await res.json();
  return {
    success: res.ok,
    data: json.data,
    canAccess: res.ok,
    message: json.message,
    accessStatus: json.accessStatus,
  };
}

export async function createAuction(
  payload: {
    name: string;
    sport: SportType;
    image: string;
    scheduledAt: string;
    timezone?: string;
    playersPerTeam: number;
    pointsBalancePerTeam: number;
    minimumBid: number;
    maximumBid: number;
    bidIncrement: number;
    visibility: AuctionVisibility;
  },
  token: string
): Promise<{ success: boolean; message: string; data?: Auction }> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auctions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to create auction');
  return data;
}

export async function updateAuction(
  id: string,
  payload: Partial<Auction> | any,
  token: string
): Promise<{ success: boolean; message: string; data?: Auction }> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auctions/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to update auction');
  return data;
}

export async function deleteAuction(
  id: string,
  token: string
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auctions/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to delete auction');
  return data;
}

export async function publishAuction(
  id: string,
  token: string
): Promise<{ success: boolean; message: string; data?: Auction }> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auctions/${id}/publish`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to publish auction');
  return data;
}

export async function cancelAuction(
  id: string,
  token: string
): Promise<{ success: boolean; message: string; data?: Auction }> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auctions/${id}/cancel`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to cancel auction');
  return data;
}

export async function archiveAuction(
  id: string,
  token: string
): Promise<{ success: boolean; message: string; data?: Auction }> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auctions/${id}/archive`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to archive auction');
  return data;
}

export async function getExportSettings(
  id: string,
  token: string
): Promise<{ success: boolean; data?: any }> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auctions/${id}/export-settings`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch export settings');
  return data;
}

export async function updateExportSettings(
  id: string,
  payload: any,
  token: string
): Promise<{ success: boolean; message: string; data?: any }> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auctions/${id}/export-settings`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to update export settings');
  return data;
}

export async function getDisplayLayout(
  id: string,
  token: string
): Promise<{ success: boolean; data?: any }> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auctions/${id}/display-layout`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch display layout');
  return data;
}

export async function updateDisplayLayout(
  id: string,
  payload: any,
  token: string
): Promise<{ success: boolean; message: string; data?: any }> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auctions/${id}/display-layout`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to update display layout');
  return data;
}

// ======================= ACCESS REQUEST & RBAC APIS =======================

export async function requestAuctionAccess(
  id: string,
  token: string
): Promise<{ success: boolean; message: string; status?: string }> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auctions/${id}/access-requests`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to request access');
  return data;
}

export async function getMyAccessStatus(
  id: string,
  token: string
): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auctions/${id}/access-requests/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  return data.data || { status: 'NONE' };
}

export async function getAdminMetrics(token: string): Promise<AdminMetrics | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/admin/metrics`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.error('getAdminMetrics error:', err);
    return null;
  }
}

export async function getAdminAccessRequests(
  token: string,
  status?: string
): Promise<AccessRequest[]> {
  try {
    const query = status && status !== 'ALL' ? `?status=${status}` : '';
    const res = await fetch(`${API_BASE_URL}/api/v1/admin/access-requests${query}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.error('getAdminAccessRequests error:', err);
    return [];
  }
}

export async function approveAccessRequest(
  requestId: string,
  token: string,
  decisionNote?: string
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE_URL}/api/v1/admin/access-requests/${requestId}/approve`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ decisionNote }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to approve request');
  return data;
}

export async function rejectAccessRequest(
  requestId: string,
  token: string,
  decisionNote?: string
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE_URL}/api/v1/admin/access-requests/${requestId}/reject`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ decisionNote }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to reject request');
  return data;
}

export async function revokeAccess(
  auctionId: string,
  userId: string,
  token: string
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE_URL}/api/v1/admin/auctions/${auctionId}/participants/${userId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to revoke access');
  return data;
}

export async function placeBid(auctionId: string, amount: number): Promise<ApiResponse<AuctionItem>> {
  const res = await fetch(`${API_BASE_URL}/api/auctions/${auctionId}/bid`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ amount }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to place bid');
  }
  return data;
}

// Authentication API Services
export async function registerUser(payload: {
  name?: string;
  email: string;
  password: string;
  profileImage: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Registration failed');
  return data;
}

export async function verifyEmailOtp(email: string, otp: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'OTP verification failed');
  return data;
}

export async function resendEmailOtp(email: string, purpose = 'EMAIL_VERIFICATION'): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/resend-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, purpose }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to resend OTP');
  return data;
}

export async function loginUser(payload: { email: string; password: string }): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok && res.status !== 403) {
    throw new Error(data.message || 'Invalid email or password');
  }
  return data;
}

export async function getCurrentUser(token: string): Promise<UserProfile | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.user || null;
  } catch {
    return null;
  }
}

export async function forgotPassword(email: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to request password reset code');
  return data;
}

export async function resetPassword(payload: {
  email: string;
  otp: string;
  newPassword: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to reset password');
  return data;
}

// ======================= TEAMS API =======================
export async function getTeams(auctionId: string): Promise<Team[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/auctions/${auctionId}/teams`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch {
    return [];
  }
}

export async function createTeam(auctionId: string, payload: Partial<Team>, token: string): Promise<Team> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auctions/${auctionId}/teams`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to create team');
  return data.data;
}

export async function updateTeam(auctionId: string, teamId: string, payload: Partial<Team>, token: string): Promise<Team> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auctions/${auctionId}/teams/${teamId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to update team');
  return data.data;
}

export async function deleteTeam(auctionId: string, teamId: string, token: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auctions/${auctionId}/teams/${teamId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message || 'Failed to delete team');
  }
}

// ======================= PLAYERS API =======================
export async function getPlayers(
  auctionId: string,
  filters: { role?: string; status?: string; search?: string; teamId?: string } = {}
): Promise<Player[]> {
  try {
    const params = new URLSearchParams();
    if (filters.role) params.set('role', filters.role);
    if (filters.status) params.set('status', filters.status);
    if (filters.search) params.set('search', filters.search);
    if (filters.teamId) params.set('teamId', filters.teamId);

    const res = await fetch(`${API_BASE_URL}/api/v1/auctions/${auctionId}/players?${params.toString()}`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch {
    return [];
  }
}

export async function createPlayer(auctionId: string, payload: Partial<Player>, token: string): Promise<Player> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auctions/${auctionId}/players`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to register player');
  return data.data;
}

export async function updatePlayer(
  auctionId: string,
  playerId: string,
  payload: Partial<Player>,
  token: string
): Promise<Player> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auctions/${auctionId}/players/${playerId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to update player');
  return data.data;
}

export async function deletePlayer(auctionId: string, playerId: string, token: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auctions/${auctionId}/players/${playerId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message || 'Failed to delete player');
  }
}

// ======================= DYNAMIC FORM BUILDER API =======================
export async function getCurrentFormTemplate(
  auctionId: string,
  formType: 'TEAM_REGISTRATION' | 'PLAYER_REGISTRATION',
  token: string
): Promise<FormTemplate> {
  const res = await fetch(
    `${API_BASE_URL}/api/v1/auctions/${auctionId}/forms/current?formType=${formType}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to load form template');
  return data.data;
}

export async function updateFormDraft(
  auctionId: string,
  formId: string,
  payload: Partial<FormTemplate>,
  token: string
): Promise<FormTemplate> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auctions/${auctionId}/forms/${formId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to save form draft');
  return data.data;
}

export async function publishFormTemplate(
  auctionId: string,
  formId: string,
  token: string
): Promise<FormTemplate> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auctions/${auctionId}/forms/${formId}/publish`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to publish form template');
  return data.data;
}

export async function getEffectiveForm(
  auctionId: string,
  formType: 'TEAM_REGISTRATION' | 'PLAYER_REGISTRATION',
  teamId?: string
): Promise<{ templateId: string; version: number; fields: FormField[] }> {
  const params = new URLSearchParams();
  params.set('formType', formType);
  if (teamId) params.set('teamId', teamId);

  const res = await fetch(
    `${API_BASE_URL}/api/v1/auctions/${auctionId}/forms/effective?${params.toString()}`,
    { cache: 'no-store' }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to resolve effective form schema');
  return data.data;
}

export async function getTeamFormConfig(auctionId: string, teamId: string): Promise<TeamFormConfig> {
  const res = await fetch(
    `${API_BASE_URL}/api/v1/auctions/${auctionId}/forms/teams/${teamId}/form-config`,
    { cache: 'no-store' }
  );
  const data = await res.json();
  return data.data || { auctionId, teamId, overrides: {} };
}

export async function saveTeamFormConfig(
  auctionId: string,
  teamId: string,
  payload: { overrides: any; formTemplateId?: string },
  token: string
): Promise<TeamFormConfig> {
  const res = await fetch(
    `${API_BASE_URL}/api/v1/auctions/${auctionId}/forms/teams/${teamId}/form-config`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to save team form configuration');
  return data.data;
}

// ======================= SUBMISSIONS & SPONSORS API =======================
export async function submitRegistrationForm(
  auctionId: string,
  payload: { formType: 'TEAM_REGISTRATION' | 'PLAYER_REGISTRATION'; data: any; teamId?: string },
  token?: string
): Promise<FormSubmission> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}/api/v1/auctions/${auctionId}/submissions`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to submit form');
  return data.data;
}

export async function getSponsors(auctionId: string): Promise<Sponsor[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/auctions/${auctionId}/sponsors`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch {
    return [];
  }
}

export async function createSponsor(auctionId: string, payload: Partial<Sponsor>, token: string): Promise<Sponsor> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auctions/${auctionId}/sponsors`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to add sponsor');
  return data.data;
}

export async function deleteSponsor(auctionId: string, sponsorId: string, token: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auctions/${auctionId}/sponsors/${sponsorId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message || 'Failed to remove sponsor');
  }
}

// ======================= LIVE AUCTION CONTROL CENTER API =======================
export interface AuctionSessionState {
  auction: {
    _id: string;
    name: string;
    sport: string;
    image: { url: string };
    scheduledAt: string;
    minimumBid: number;
    maximumBid: number;
    bidIncrement: number;
    playersPerTeam: number;
    minPlayersPerTeam?: number;
    maxPlayersPerTeam?: number;
    rosterPolicy?: 'MANDATORY' | 'FLEXIBLE';
    pointsBalancePerTeam: number;
    status: string;
  };
  session: {
    _id: string;
    mode: 'NORMAL' | 'LIVE';
    status: 'READY' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
    playerSelectionMode: 'RANDOM' | 'MANUAL';
    currentPlayer: Player | null;
    selectedTeam: Team | null;
    currentBid: number;
    version: number;
    startedAt: string;
  } | null;
  teams: Team[];
  stats: {
    sold: number;
    unsold: number;
    available: number;
    totalRegistered: number;
    totalTeams: number;
    totalSpend: number;
  };
}

export async function startAuctionSession(
  auctionId: string,
  mode: 'NORMAL' | 'LIVE',
  playerSelectionMode: 'RANDOM' | 'MANUAL' = 'RANDOM',
  token?: string
): Promise<AuctionSessionState> {
  const authToken = token || getStoredToken() || '';
  const res = await fetch(`${API_BASE_URL}/api/v1/auctions/${auctionId}/session/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ mode, playerSelectionMode }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to start auction session');
  return data.data;
}

export async function getAuctionSessionState(auctionId: string): Promise<AuctionSessionState> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auctions/${auctionId}/session/state`, {
    cache: 'no-store',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch auction state');
  return data.data;
}

export async function selectRandomPlayer(auctionId: string, token?: string): Promise<AuctionSessionState> {
  const authToken = token || getStoredToken() || '';
  const res = await fetch(`${API_BASE_URL}/api/v1/auctions/${auctionId}/session/players/select-random`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${authToken}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to select random player');
  return data.data;
}

export async function selectManualPlayer(auctionId: string, playerId: string, token?: string): Promise<AuctionSessionState> {
  const authToken = token || getStoredToken() || '';
  const res = await fetch(`${API_BASE_URL}/api/v1/auctions/${auctionId}/session/players/select`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ playerId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to select player');
  return data.data;
}

export async function bidUpSession(auctionId: string, teamId?: string, token?: string): Promise<AuctionSessionState> {
  const authToken = token || getStoredToken() || '';
  const res = await fetch(`${API_BASE_URL}/api/v1/auctions/${auctionId}/session/bid-up`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ teamId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to bid up');
  return data.data;
}

export async function bidDownSession(auctionId: string, token?: string): Promise<AuctionSessionState> {
  const authToken = token || getStoredToken() || '';
  const res = await fetch(`${API_BASE_URL}/api/v1/auctions/${auctionId}/session/bid-down`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${authToken}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to bid down');
  return data.data;
}

export async function sellPlayerSession(
  auctionId: string,
  teamId: string,
  customPrice?: number,
  token?: string
): Promise<AuctionSessionState> {
  const authToken = token || getStoredToken() || '';
  const res = await fetch(`${API_BASE_URL}/api/v1/auctions/${auctionId}/session/sell`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ teamId, customPrice }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to mark player as sold');
  return data.data;
}

export async function unsoldPlayerSession(auctionId: string, token?: string): Promise<AuctionSessionState> {
  const authToken = token || getStoredToken() || '';
  const res = await fetch(`${API_BASE_URL}/api/v1/auctions/${auctionId}/session/unsold`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${authToken}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to mark player as unsold');
  return data.data;
}

export async function pauseAuctionSession(auctionId: string, token?: string): Promise<AuctionSessionState> {
  const authToken = token || getStoredToken() || '';
  const res = await fetch(`${API_BASE_URL}/api/v1/auctions/${auctionId}/session/pause`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${authToken}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to pause session');
  return data.data;
}

export async function resumeAuctionSession(auctionId: string, token?: string): Promise<AuctionSessionState> {
  const authToken = token || getStoredToken() || '';
  const res = await fetch(`${API_BASE_URL}/api/v1/auctions/${auctionId}/session/resume`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${authToken}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to resume session');
  return data.data;
}

export async function completeAuctionSession(auctionId: string, token?: string): Promise<AuctionSessionState> {
  const authToken = token || getStoredToken() || '';
  const res = await fetch(`${API_BASE_URL}/api/v1/auctions/${auctionId}/session/complete`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${authToken}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to complete session');
  return data.data;
}

export async function getEligiblePlayersSession(auctionId: string): Promise<Player[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auctions/${auctionId}/session/eligible-players`, {
    cache: 'no-store',
  });
  const data = await res.json();
  if (!res.ok) return [];
  return data.data || [];
}

export async function getTrackingBidsSession(auctionId: string): Promise<any[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auctions/${auctionId}/session/tracking`, {
    cache: 'no-store',
  });
  const data = await res.json();
  if (!res.ok) return [];
  return data.data || [];
}


