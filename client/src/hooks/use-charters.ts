import { useQuery } from "@tanstack/react-query";
import type { CharterWithCaptain } from "@shared/schema";

interface SearchFilters {
  location?: string;
  targetSpecies?: string;
  duration?: string;
}

export function useCharters(filters?: SearchFilters) {
  return useQuery<CharterWithCaptain[]>({
    queryKey: ["/api/charters", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.location) params.set("location", filters.location);
      if (filters?.targetSpecies) params.set("targetSpecies", filters.targetSpecies);
      if (filters?.duration) params.set("duration", filters.duration);
      
      const response = await fetch(`/api/charters?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch charters");
      return response.json();
    },
  });
}

export function useCharter(id: string | number) {
  return useQuery<CharterWithCaptain>({
    queryKey: [`/api/charters/${id}`],
    enabled: !!id,
  });
}
