import { API_BASE_URL } from './api-config';

const AUTH_STATE_EVENT = 'auth-state-changed';

type ApiResponse<TData = unknown> = {
  success?: boolean;
  message?: string;
  data?: TData;
};

type AuthSuccessPayload = {
  accessToken?: string;
  user?: AuthUser;
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  address?: string | null;
  role: 'USER' | 'ADMIN';
  points?: number;
  emailVerified: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type RegisterPayload = {
  user?: unknown;
  email?: string;
  message?: string;
  emailVerificationRequired?: boolean;
  verificationEmailSent?: boolean;
};

type SessionUser = {
  email?: string;
  emailVerified?: boolean;
};

export type ReportPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
export type ReportStatus = 'PENDING' | 'VERIFIED' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED' | 'CANCELLED';
export type ReportCategory =
  | 'CRIMINAL'
  | 'TRASH'
  | 'FLOOD'
  | 'POLLUTION'
  | 'ROADS_ISSUE'
  | 'PUBLIC_DISTURBANCE'
  | 'ACCIDENTS'
  | 'OTHERS';

type CreateReportBasePayload = {
  title: string;
  description: string;
  category: ReportCategory[];
  priority: ReportPriority;
  latitude?: number;
  longitude?: number;
  address?: string;
};

export type CreateReportJsonPayload = CreateReportBasePayload & {
  imageBase64?: string;
  imageMimeType?: string;
};

export type CreateReportMultipartPayload = CreateReportBasePayload & {
  image?: File | null;
};

export type ReportListItem = {
  id: string;
  title: string;
  description: string;
  feedback?: string | null;
  priority: ReportPriority;
  status: ReportStatus;
  category: ReportCategory[];
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  aiSpamFlag?: boolean | null;
  createdAt: string;
  updatedAt: string;
  editedByReporter?: boolean;
  lastEditedByReporterAt?: string | null;
  cancelledByRole?: 'USER' | 'ADMIN' | null;
  cancelledAt?: string | null;
  reporter?: {
    id?: string;
    name?: string;
  };
  reportImages?: ReportImageItem[];
};

export type ReportImageItem = {
  id: string;
  url: string;
};

export type ReportDetailItem = ReportListItem & {
  reporter?: {
    id?: string;
    name?: string;
    email?: string;
  };
  reportImages?: ReportImageItem[];
};

export type ReportsListData = {
  items: ReportListItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export type ListReportsParams = {
  status?: ReportStatus;
  priority?: ReportPriority;
  category?: ReportCategory;
  hasImage?: boolean;
  includeTotal?: boolean;
  page?: number;
  limit?: number;
};

export type ReportStatsPayload = {
  totalCreated: number;
  inProgress: number;
  totalResolved: number;
  statusBreakdown: {
    PENDING: number;
    VERIFIED: number;
    IN_PROGRESS: number;
    RESOLVED: number;
    REJECTED: number;
    CANCELLED: number;
  };
};

export type UpdateReportPayload = {
  title?: string;
  description?: string;
  category?: ReportCategory[];
  priority?: ReportPriority;
  latitude?: number;
  longitude?: number;
  address?: string;
};

export type ReportClassificationPayload = {
  category: ReportCategory | null;
  confidenceScore: number | null;
  isSpam: boolean;
  aiError: boolean;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export class APIError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details: unknown = null) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.details = details;
  }
}

// Store token di localStorage
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

const isVerifiedUser = (value: unknown): value is SessionUser =>
  isRecord(value) && value.emailVerified === true;

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const removeToken = () => localStorage.removeItem(TOKEN_KEY);

export const getUser = () => {
  const data = localStorage.getItem(USER_KEY);
  return data ? JSON.parse(data) : null;
};
export const setUser = (user: unknown) => localStorage.setItem(USER_KEY, JSON.stringify(user));
export const removeUser = () => localStorage.removeItem(USER_KEY);



export const isAuthenticated = () => {
  const token = getToken();
  const user = getUser();

  if (!token || !isVerifiedUser(user)) {
    return false;
  }

  return true;
};

export const getApiErrorDetails = <T = Record<string, unknown>>(error: unknown): T | null => {
  if (!(error instanceof APIError)) {
    return null;
  }

  if (!error.details || typeof error.details !== 'object') {
    return null;
  }

  return error.details as T;
};

const emitAuthStateChanged = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(AUTH_STATE_EVENT));
  }
};

// Generic fetch helper
async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const resolvedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${resolvedEndpoint}`;
  const isFormDataRequest = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };
  const hasExplicitContentType = Object.keys(headers).some((key) => key.toLowerCase() === 'content-type');

  if (!isFormDataRequest && !hasExplicitContentType) {
    headers['Content-Type'] = 'application/json';
  }

  const token = getToken();
  const user = getUser();

  if (token && isVerifiedUser(user)) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    if (response.status === 401) {
      logout();
    }

    const message = isRecord(data) && typeof data.message === 'string'
      ? data.message
      : `Request failed with status ${response.status}`;
    const details = isRecord(data) ? data.details : null;

    throw new APIError(message, response.status, details);
  }

  return data as T;
}

// Auth API endpoints
export const authAPI = {
  // Register
  register: (payload: { name: string; email: string; password: string; address?: string }) =>
    apiFetch<ApiResponse<RegisterPayload>>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Login
  login: (payload: { email: string; password: string }) =>
    apiFetch<ApiResponse<AuthSuccessPayload>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Google Login/Register
  googleAuth: (payload: { idToken: string }) =>
    apiFetch<ApiResponse<AuthSuccessPayload>>('/auth/google', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Verify Email
  verifyEmail: (payload: { email: string; token: string }) =>
    apiFetch<ApiResponse<AuthSuccessPayload>>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Kirim Ulang Email Verifikasi
  resendVerificationEmail: (email: string) =>
    apiFetch<ApiResponse>('/auth/resend-verification-email', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  // Forgot Password
  forgotPassword: (email: string) =>
    apiFetch<ApiResponse>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  // Reset Password
  resetPassword: (payload: { email: string; token: string; newPassword: string }) =>
    apiFetch<ApiResponse>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Get Current User
  me: () => apiFetch<ApiResponse<AuthUser>>('/auth/me', { method: 'GET' }),
};

const buildCreateReportFormData = (payload: CreateReportMultipartPayload) => {
  const formData = new FormData();
  formData.append('title', payload.title);
  formData.append('description', payload.description);
  formData.append('priority', payload.priority);
  formData.append('category', JSON.stringify(payload.category));

  if (typeof payload.latitude === 'number') {
    formData.append('latitude', String(payload.latitude));
  }

  if (typeof payload.longitude === 'number') {
    formData.append('longitude', String(payload.longitude));
  }

  if (payload.address) {
    formData.append('address', payload.address);
  }

  if (payload.image) {
    formData.append('image', payload.image);
  }

  return formData;
};

export const reportsAPI = {
  list: (params: ListReportsParams = {}) => {
    const search = new URLSearchParams();

    if (params.status) {
      search.set('status', params.status);
    }

    if (params.priority) {
      search.set('priority', params.priority);
    }

    if (params.category) {
      search.set('category', params.category);
    }

    if (typeof params.hasImage === 'boolean') {
      search.set('hasImage', String(params.hasImage));
    }

    if (typeof params.includeTotal === 'boolean') {
      search.set('includeTotal', String(params.includeTotal));
    }

    if (typeof params.page === 'number') {
      search.set('page', String(params.page));
    }

    if (typeof params.limit === 'number') {
      search.set('limit', String(params.limit));
    }

    const suffix = search.toString();
    const endpoint = suffix ? `/reports?${suffix}` : '/reports';

    return apiFetch<ApiResponse<ReportsListData>>(endpoint, { method: 'GET' });
  },

  create: (payload: CreateReportJsonPayload) =>
    apiFetch<ApiResponse<unknown>>('/reports', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  createWithImage: (payload: CreateReportMultipartPayload) =>
    apiFetch<ApiResponse<unknown>>('/reports', {
      method: 'POST',
      body: buildCreateReportFormData(payload),
    }),

  classify: (payload: { title: string; description: string; imageBase64?: string; imageMimeType?: string }) =>
    apiFetch<ApiResponse<ReportClassificationPayload>>('/reports/classify', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  stats: () =>
    apiFetch<ApiResponse<ReportStatsPayload>>('/reports/stats', {
      method: 'GET',
      cache: 'no-store',
    }),

  detail: (id: string) =>
    apiFetch<ApiResponse<ReportDetailItem>>(`/reports/${id}`, {
      method: 'GET',
    }),

  updateStatus: (id: string, status: ReportStatus, feedback?: string) =>
    apiFetch<ApiResponse<ReportDetailItem>>(`/reports/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, ...(feedback ? { feedback } : {}) }),
    }),

  update: (id: string, payload: UpdateReportPayload) =>
    apiFetch<ApiResponse<ReportDetailItem>>(`/reports/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
};

// Helper functions
export const parseAuthResponse = (response: ApiResponse<AuthSuccessPayload>) => {
  const payload = response.data;

  if (payload?.accessToken) {
    setToken(payload.accessToken);

    if (payload.user) {
      setUser(payload.user);

      // Tidak perlu clear pending verification email
    }
  }

  emitAuthStateChanged();
  return payload;
};

export const logout = () => {
  removeToken();
  removeUser();
  emitAuthStateChanged();
};

export const authStateEvent = AUTH_STATE_EVENT;
