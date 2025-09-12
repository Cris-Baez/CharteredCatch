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
      
      // Asegurar URL absoluta en producción
      const baseUrl = `/api/charters?${params.toString()}`;
      const absoluteUrl = baseUrl.startsWith('http') ? baseUrl : 
                         typeof window !== 'undefined' && window.location ? 
                         `${window.location.origin}${baseUrl}` : baseUrl;
      
      const response = await fetch(absoluteUrl, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch charters: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Validación adicional - si no hay datos, lanzar error para activar retry
      if (!Array.isArray(data)) {
        throw new Error("Invalid charters data format received");
      }
      
      return data;
    },
    // Configuración específica para charters con doble carga
    retry: 2, // Hasta 3 intentos total (1 inicial + 2 reintentos)
    retryDelay: (attemptIndex) => {
      console.log(`Reintentando cargar charters (intento ${attemptIndex + 2}/3)...`);
      return Math.min(1000 * (attemptIndex + 1), 2000); // 1s, 2s
    },
  });
}

export function useCharter(id: string | number) {
  return useQuery<CharterWithCaptain>({
    queryKey: [`/api/charters/${id}`],
    enabled: !!id,
    // Doble carga también para charters individuales
    retry: 2,
    retryDelay: (attemptIndex) => {
      console.log(`Reintentando cargar charter ${id} (intento ${attemptIndex + 2}/3)...`);
      return Math.min(1000 * (attemptIndex + 1), 2000);
    },
  });
}
