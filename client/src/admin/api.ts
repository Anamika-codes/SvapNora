import { apiRequest } from "../lib/api";
import type { AdminUser, AdminRole } from "./AdminAuthProvider";

export type CapabilityStatus = "IMPLEMENTED" | "IN_PROGRESS" | "PLANNED" | "RESEARCH";
export type PaymentStatus =
  | "PENDING"
  | "SUCCESSFUL"
  | "FAILED"
  | "CANCELLED"
  | "PARTIALLY_REFUNDED"
  | "REFUNDED";

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export interface Payment {
  id: string;
  provider: string;
  providerTxnId: string;
  customerName: string | null;
  customerEmail: string | null;
  orderRef: string | null;
  amountMinor: string;
  amountFormatted: string;
  currency: string;
  method: string | null;
  status: PaymentStatus;
  refundedAmountMinor: string;
  refundedFormatted: string;
  reconciliation: "UNRECONCILED" | "RECONCILED" | "DISCREPANCY";
  createdAt: string;
  updatedAt: string;
}

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  subject: string;
  category: "GENERAL" | "TECHNICAL" | "PARTNERSHIP" | "COLLABORATION";
  message: string;
  status: "NEW" | "READ" | "ARCHIVED";
  createdAt: string;
}

export interface Feature {
  id: string;
  category: string;
  title: string;
  description: string;
  status: CapabilityStatus;
  sortOrder: number;
  isPublished: boolean;
}

export interface Milestone {
  id: string;
  phase: string;
  title: string;
  description: string;
  status: CapabilityStatus;
  sortOrder: number;
  isPublished: boolean;
}

export interface RoadmapItem {
  id: string;
  category: string;
  title: string;
  description: string;
  status: CapabilityStatus;
  sortOrder: number;
  isPublished: boolean;
}

export interface PaymentProviderInfo {
  provider: string;
  demoMode: boolean;
  currency: string;
  configured: boolean;
}

export interface OverviewData {
  payments: {
    total: number;
    byStatus: Record<string, number>;
    recent: Payment[];
    refundedTotalMinor: string;
  };
  provider: PaymentProviderInfo;
  contacts: { total: number; unread: number; recent: ContactSubmission[] };
  content: {
    pages: number;
    published: number;
    draft: number;
    features: number;
    milestones: number;
    roadmapItems: number;
  };
}

export interface AuditEntry {
  id: string;
  actorEmail: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  metadata: unknown;
  ip: string | null;
  createdAt: string;
}

export const adminApi = {
  overview: () => apiRequest<OverviewData>("/admin/overview"),

  payments: {
    summary: () =>
      apiRequest<{
        total: number;
        byStatus: Record<string, number>;
        recent: Payment[];
        refundedTotalMinor: string;
      }>("/admin/payments/summary"),
    list: (params: Record<string, string | number | undefined>) =>
      apiRequest<Paginated<Payment>>(`/admin/payments?${toQuery(params)}`),
    get: (id: string) => apiRequest<{ payment: Payment & { events: unknown[]; refunds: unknown[] } }>(`/admin/payments/${id}`),
    create: (body: unknown) =>
      apiRequest<{ payment: Payment }>("/admin/payments", { method: "POST", body }),
    update: (id: string, body: unknown) =>
      apiRequest<{ payment: Payment }>(`/admin/payments/${id}`, { method: "PATCH", body }),
    exportUrl: (params: Record<string, string | number | undefined>) =>
      `/admin/payments/export?${toQuery(params)}`,
  },

  contact: {
    list: (params: Record<string, string | number | undefined>) =>
      apiRequest<Paginated<ContactSubmission>>(`/admin/contact?${toQuery(params)}`),
    get: (id: string) => apiRequest<{ submission: ContactSubmission }>(`/admin/contact/${id}`),
    update: (id: string, body: unknown) =>
      apiRequest<{ submission: ContactSubmission }>(`/admin/contact/${id}`, { method: "PATCH", body }),
  },

  content: {
    listPages: () => apiRequest<Paginated<{ id: string; slug: string; title: string; status: string; updatedAt: string }>>("/admin/content/pages"),
    createPage: (body: unknown) => apiRequest("/admin/content/pages", { method: "POST", body }),
    updatePage: (id: string, body: unknown) => apiRequest(`/admin/content/pages/${id}`, { method: "PUT", body }),
    deletePage: (id: string) => apiRequest(`/admin/content/pages/${id}`, { method: "DELETE" }),

    listFeatures: () => apiRequest<{ items: Feature[] }>("/admin/content/features"),
    createFeature: (body: unknown) => apiRequest("/admin/content/features", { method: "POST", body }),
    updateFeature: (id: string, body: unknown) => apiRequest(`/admin/content/features/${id}`, { method: "PUT", body }),
    deleteFeature: (id: string) => apiRequest(`/admin/content/features/${id}`, { method: "DELETE" }),

    listMilestones: () => apiRequest<{ items: Milestone[] }>("/admin/content/milestones"),
    createMilestone: (body: unknown) => apiRequest("/admin/content/milestones", { method: "POST", body }),
    updateMilestone: (id: string, body: unknown) => apiRequest(`/admin/content/milestones/${id}`, { method: "PUT", body }),
    deleteMilestone: (id: string) => apiRequest(`/admin/content/milestones/${id}`, { method: "DELETE" }),

    listRoadmap: () => apiRequest<{ items: RoadmapItem[] }>("/admin/content/roadmap"),
    createRoadmap: (body: unknown) => apiRequest("/admin/content/roadmap", { method: "POST", body }),
    updateRoadmap: (id: string, body: unknown) => apiRequest(`/admin/content/roadmap/${id}`, { method: "PUT", body }),
    deleteRoadmap: (id: string) => apiRequest(`/admin/content/roadmap/${id}`, { method: "DELETE" }),
  },

  audit: {
    list: (params: Record<string, string | number | undefined>) =>
      apiRequest<Paginated<AuditEntry>>(`/admin/audit?${toQuery(params)}`),
  },

  admins: {
    list: () =>
      apiRequest<{ items: Array<AdminUser & { isActive: boolean; lastLoginAt: string | null; createdAt: string }> }>(
        "/admin/admins",
      ),
    create: (body: { email: string; name: string; password: string; role: AdminRole }) =>
      apiRequest("/admin/admins", { method: "POST", body }),
    update: (id: string, body: unknown) =>
      apiRequest(`/admin/admins/${id}`, { method: "PATCH", body }),
    revoke: (id: string) => apiRequest(`/admin/admins/${id}/revoke-sessions`, { method: "POST" }),
  },
};

function toQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  return search.toString();
}
