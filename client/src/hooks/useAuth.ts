// client/src/hooks/useAuth.ts
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  const { data, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      const res = await fetch("/api/auth/user", { credentials: "include" });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to load user");
      return res.json();
    },
    retry: false,
    staleTime: 60_000,
  });

  return {
    user: data,
    isLoading,
    isAuthenticated: !!data,
  };
}

