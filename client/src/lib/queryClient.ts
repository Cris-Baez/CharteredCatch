import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Asegurar URL absoluta en producción
  const absoluteUrl = url.startsWith('http') ? url : 
                     typeof window !== 'undefined' && window.location ? 
                     `${window.location.origin}${url}` : url;
  
  const res = await fetch(absoluteUrl, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey[0] as string;
    // Asegurar URL absoluta en producción
    const absoluteUrl = url.startsWith('http') ? url : 
                       typeof window !== 'undefined' && window.location ? 
                       `${window.location.origin}${url}` : url;
    
    const res = await fetch(absoluteUrl, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: (failureCount, error: any) => {
        // Doble carga automática para endpoints críticos como charters
        if (error?.message?.includes('charters') || error?.message?.includes('Failed to fetch')) {
          return failureCount < 2; // Máximo 2 reintentos (3 total intentos)
        }
        return failureCount < 1; // 1 reintento para otros endpoints
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000), // Exponential backoff máximo 3s
    },
    mutations: {
      retry: false,
    },
  },
});
