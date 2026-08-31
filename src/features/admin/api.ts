import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client";

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  region: string | null;
  joinedAt: string | null;
  opens: number;
  screenViews: number;
  workouts: number;
  lastSeenAt: string | null;
};

export type AdminUsersResponse = {
  success: true;
  totals: { users: number; active7d: number; opens: number };
  data: AdminUserRow[];
};

export type AdminUserDetail = {
  id: string;
  name: string;
  email: string;
  joinedAt: string | null;
  region: string | null;
  age: number | null;
  fitnessGoal: string | null;
  experienceLevel: string | null;
  isSubscribed: boolean;
  opens: number;
  screens: { screen: string; count: number; lastAt: string }[];
  timeline: { type: string; screen: string | null; at: string }[];
};

export function useAdminUsers() {
  return useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => api.get<AdminUsersResponse>("/admin/users"),
    staleTime: 30_000,
  });
}

export function useAdminUser(id: string | null) {
  return useQuery({
    queryKey: ["admin", "user", id],
    queryFn: () =>
      api.get<{ success: true; data: AdminUserDetail }>(`/admin/users/${id}`),
    enabled: !!id,
    staleTime: 30_000,
  });
}
