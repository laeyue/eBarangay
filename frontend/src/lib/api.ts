const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Types
interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}

// Constants
const TOKEN_KEY = "token";
const USER_KEY = "user";

// Token management
const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

// User management
const setUser = (user: any): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

const getUser = (): any | null => {
  const user = localStorage.getItem(USER_KEY);
  try {
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

const removeUser = (): void => {
  localStorage.removeItem(USER_KEY);
};

// Enhanced API client with better error handling
const apiClient = async <T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getToken();

  const config: RequestInit = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        message: `HTTP error! status: ${response.status}`,
      }));
      throw new Error(error.message || "An error occurred");
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Network error occurred");
  }
};

// Auth API
export const auth = {
  register: async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => {
    const result = await apiClient("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
    setToken(result.token);
    setUser(result);
    return result;
  },

  login: async (email: string, password: string) => {
    const result = await apiClient("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setToken(result.token);
    setUser(result);

    // Also fetch complete user data from /auth/me to ensure all fields are present
    try {
      const completeUser = await apiClient("/auth/me", {
        headers: {
          Authorization: `Bearer ${result.token}`,
        },
      });
      setUser(completeUser);
      return completeUser;
    } catch (error) {
      // If /auth/me fails, return the login response
      return result;
    }
  },

  logout: (): void => {
    removeToken();
    removeUser();
  },

  getCurrentUser: async () => {
    try {
      return await apiClient("/auth/me");
    } catch (error) {
      removeToken();
      removeUser();
      throw error;
    }
  },

  getStoredUser: getUser,
  getToken,
  isAuthenticated: (): boolean => !!getToken(),
};

// Incidents API
export const incidents = {
  create: async (data: FormData) => {
    const token = getToken();
    const response = await fetch(`${API_URL}/incidents`, {
      method: "POST",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: data,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: "Failed to create incident",
      }));
      throw new Error(error.message);
    }

    return response.json();
  },

  getAll: async () => {
    return apiClient("/incidents");
  },

  getMyIncidents: async () => {
    return apiClient("/incidents/my");
  },

  getById: async (id: string) => {
    return apiClient(`/incidents/${id}`);
  },

  update: async (id: string, data: any) => {
    return apiClient(`/incidents/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return apiClient(`/incidents/${id}`, {
      method: "DELETE",
    });
  },
};

// Documents API
export const documents = {
  create: async (data: any) => {
    return apiClient("/documents", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getAll: async () => {
    return apiClient("/documents");
  },

  getMyRequests: async () => {
    return apiClient("/documents/my");
  },

  getById: async (id: string) => {
    return apiClient(`/documents/${id}`);
  },

  update: async (id: string, data: any) => {
    return apiClient(`/documents/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return apiClient(`/documents/${id}`, {
      method: "DELETE",
    });
  },
};

// Admin API
export const admin = {
  getStats: async () => {
    return apiClient("/admin/stats");
  },

  getUsers: async (page = 1, limit = 10, search = "", isActive?: boolean) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (search) params.append("search", search);
    if (isActive !== undefined) params.append("isActive", isActive.toString());
    return apiClient(`/admin/users?${params.toString()}`);
  },

  updateUser: async (id: string, data: any) => {
    return apiClient(`/admin/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  deleteUser: async (id: string) => {
    return apiClient(`/admin/users/${id}`, {
      method: "DELETE",
    });
  },

  getIncidents: async (page = 1, limit = 10, status?: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (status) params.append("status", status);
    return apiClient(`/admin/incidents?${params.toString()}`);
  },

  getDocuments: async (page = 1, limit = 10, status?: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (status) params.append("status", status);
    return apiClient(`/admin/documents?${params.toString()}`);
  },

  updateIncidentStatus: async (
    id: string,
    status: string,
    adminNotes?: string
  ) => {
    return apiClient(`/admin/incidents/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status, adminNotes }),
    });
  },

  // Add missing updateIncident method for frontend compatibility
  updateIncident: async (id: string, data: any) => {
    return apiClient(`/admin/incidents/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  updateDocumentStatus: async (
    id: string,
    status: string,
    adminNotes?: string
  ) => {
    return apiClient(`/admin/documents/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status, adminNotes }),
    });
  },

  // Add missing updateDocument method for frontend compatibility
  updateDocument: async (id: string, data: any) => {
    return apiClient(`/admin/documents/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
};

// SMS API
export const sms = {
  getAll: async (page = 1, limit = 10): Promise<any> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    return apiClient(`/sms?${params.toString()}`);
  },

  send: async (data: {
    title: string;
    message: string;
    type?: string;
    priority?: string;
    recipients?: string;
    specificRecipients?: string[];
  }): Promise<any> => {
    return apiClient("/sms/send", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  sendBulk: async (data: { phoneNumbers: string[]; message: string }) => {
    return apiClient("/sms/send-bulk", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getAlerts: async () => {
    return apiClient("/sms/alerts");
  },

  getById: async (id: string): Promise<any> => {
    return apiClient(`/sms/${id}`);
  },

  update: async (
    id: string,
    data: {
      title: string;
      message: string;
      type?: string;
      priority?: string;
    }
  ): Promise<any> => {
    return apiClient(`/sms/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<any> => {
    return apiClient(`/sms/${id}`, {
      method: "DELETE",
    });
  },
};

// Polls API
export const polls = {
  getAll: async (
    page = 1,
    limit = 50,
    status?: string,
    includeDeleted = false
  ) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (status) params.append("status", status);
    if (includeDeleted) params.append("includeDeleted", "true");
    return apiClient(`/polls?${params.toString()}`);
  },

  getNew: async (limit = 10) => {
    const params = new URLSearchParams({
      page: "1",
      limit: limit.toString(),
      status: "active",
    });
    return apiClient(`/polls?${params.toString()}`);
  },

  getUnreadCount: async () => {
    try {
      // Count unread poll notifications
      const response = await apiClient("/notifications/unread");
      const notifs = response?.notifications || [];
      const unreadPollCount = notifs.filter(
        (n: any) => n?.type?.toLowerCase?.() === "poll"
      ).length;
      return { count: unreadPollCount, notifications: notifs };
    } catch (error) {
      console.error("Error fetching unread poll count:", error);
      return { count: 0, notifications: [] };
    }
  },

  getById: async (id: string) => {
    return apiClient(`/polls/${id}`);
  },

  create: async (data: any) => {
    return apiClient("/polls", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  vote: async (id: string, answers: any) => {
    return apiClient(`/polls/${id}/vote`, {
      method: "POST",
      body: JSON.stringify({ answers }),
    });
  },

  getResults: async (id: string) => {
    return apiClient(`/polls/${id}/results`);
  },

  update: async (id: string, data: any) => {
    return apiClient(`/polls/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  close: async (id: string) => {
    return apiClient(`/polls/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "closed" }),
    });
  },

  updateStatus: async (id: string, status: string) => {
    return apiClient(`/polls/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },

  delete: async (id: string) => {
    return apiClient(`/polls/${id}`, {
      method: "DELETE",
    });
  },
};

// Notifications API
export const notifications = {
  getAll: async (page = 1, limit = 50, unreadOnly = false, type?: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (unreadOnly) params.append("unreadOnly", "true");
    if (type) params.append("type", type);
    return apiClient(`/notifications?${params.toString()}`);
  },

  getUnread: async () => {
    return apiClient("/notifications/unread");
  },

  getUnreadCount: async (type?: string) => {
    const params = new URLSearchParams();
    if (type) params.append("type", type);
    const query = params.toString();
    return apiClient(`/notifications/unread-count${query ? `?${query}` : ""}`);
  },

  markAsRead: async (id: string) => {
    return apiClient(`/notifications/${id}/read`, {
      method: "PATCH",
    });
  },

  markAsUnread: async (id: string) => {
    return apiClient(`/notifications/${id}/unread`, {
      method: "PATCH",
    });
  },

  markAllAsRead: async () => {
    return apiClient("/notifications/mark-all-read", {
      method: "PATCH",
    });
  },

  markAnnouncementsAsRead: async () => {
    return apiClient("/notifications/mark-announcements-read", {
      method: "PATCH",
    });
  },

  markSmsAsRead: async () => {
    return apiClient("/notifications/mark-sms-read", {
      method: "PATCH",
    });
  },

  markVerificationAsRead: async () => {
    return apiClient("/notifications/mark-verification-read", {
      method: "PATCH",
    });
  },

  delete: async (id: string) => {
    return apiClient(`/notifications/${id}`, {
      method: "DELETE",
    });
  },

  updateAdminNotes: async (id: string, adminNotes: string) => {
    return apiClient(`/notifications/${id}/admin-notes`, {
      method: "PATCH",
      body: JSON.stringify({ adminNotes }),
    });
  },
};

// Announcements API
export const announcements = {
  getAll: async (page = 1, limit = 50, category?: string, search?: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (category && category !== "all") params.append("category", category);
    if (search) params.append("search", search);
    return apiClient(`/announcements?${params.toString()}`);
  },

  getNew: async (limit = 10) => {
    const params = new URLSearchParams({
      page: "1",
      limit: limit.toString(),
    });
    return apiClient(`/announcements?${params.toString()}`);
  },

  getUnreadCount: async () => {
    try {
      // Count unread announcement notifications
      const response = await apiClient("/notifications/unread");
      const notifs = response?.notifications || [];
      const unreadAnnouncementCount = notifs.filter(
        (n: any) => n?.type?.toLowerCase?.() === "announcement"
      ).length;
      return { count: unreadAnnouncementCount, notifications: notifs };
    } catch (error) {
      console.error("Error fetching unread announcement count:", error);
      return { count: 0, notifications: [] };
    }
  },

  getAllAdmin: async (page = 1, limit = 50, status?: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (status) params.append("status", status);
    return apiClient(`/announcements/admin/all?${params.toString()}`);
  },

  getById: async (id: string) => {
    return apiClient(`/announcements/${id}`);
  },

  create: async (data: any) => {
    return apiClient("/announcements", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: any) => {
    return apiClient(`/announcements/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return apiClient(`/announcements/${id}`, {
      method: "DELETE",
    });
  },
  markAsRead: async (id: string) => {
    return apiClient(`/announcements/${id}/mark-read`, {
      method: "POST",
    });
  },
};

// Stats API
export const stats = {
  getPublic: async () => {
    return apiClient("/stats/public");
  },
};
