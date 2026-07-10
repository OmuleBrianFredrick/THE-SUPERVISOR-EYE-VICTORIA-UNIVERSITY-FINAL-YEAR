import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';

export const queryKeys = {
  tasks: ['tasks'],
  reports: ['reports'],
  evidence: ['evidence'],
  users: ['users'],
  subordinates: ['subordinates'],
  stats: ['stats'],
  analytics: ['analytics'],
  approvals: ['approvals'],
  notifications: ['notifications'],
};

// Generic fetcher
export async function fetchWithAuth(url: string, token: string, options: RequestInit = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }
  // Return null for 204 No Content
  if (response.status === 204) return null;
  return response.json();
}

export function useTasksQuery() {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: queryKeys.tasks,
    queryFn: async () => {
      const token = await getToken();
      return fetchWithAuth('/api/v1/tasks', token);
    },
  });
}

export function useSubordinatesQuery() {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: queryKeys.subordinates,
    queryFn: async () => {
      const token = await getToken();
      return fetchWithAuth('/api/v1/tasks/subordinates', token);
    },
  });
}

export function useReportsQuery(params?: any) {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: [...queryKeys.reports, params],
    queryFn: async () => {
      const token = await getToken();
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return fetchWithAuth(`/api/v1/reports${qs}`, token);
    },
  });
}

export function useEvidenceQuery(params?: any) {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: [...queryKeys.evidence, params],
    queryFn: async () => {
      const token = await getToken();
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return fetchWithAuth(`/api/v1/evidence${qs}`, token);
    },
  });
}

export function useApprovalsQuery(params?: any) {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: [...queryKeys.approvals, params],
    queryFn: async () => {
      const token = await getToken();
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return fetchWithAuth(`/api/v1/approvals/pending${qs}`, token);
    },
  });
}

export function useExecutiveSummaryQuery() {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: [...queryKeys.analytics, 'executive-summary'],
    queryFn: async () => {
      const token = await getToken();
      return fetchWithAuth('/api/v1/analytics/executive-summary', token);
    },
  });
}

export function useEvidenceAnalyticsQuery() {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: [...queryKeys.analytics, 'evidence'],
    queryFn: async () => {
      const token = await getToken();
      return fetchWithAuth('/api/v1/evidence/analytics', token);
    },
  });
}

export function useUsersQuery(params?: any) {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: [...queryKeys.users, params],
    queryFn: async () => {
      const token = await getToken();
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return fetchWithAuth(`/api/v1/admin/users${qs}`, token);
    },
  });
}

export function useAdminStatsQuery() {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: [...queryKeys.stats, 'admin'],
    queryFn: async () => {
      const token = await getToken();
      return fetchWithAuth('/api/v1/admin/stats', token);
    },
  });
}

export function useInvalidateQueries() {
  const queryClient = useQueryClient();
  return (keys: any[][]) => {
    keys.forEach((key) => {
      queryClient.invalidateQueries({ queryKey: key });
    });
  };
}