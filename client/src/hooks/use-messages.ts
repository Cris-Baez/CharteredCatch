import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { MessageThread, Message } from "@shared/schema";

export function useMessageThreads(userId: number) {
  return useQuery<MessageThread[]>({
    queryKey: [`/api/messages/threads/${userId}`],
    enabled: !!userId,
  });
}

export function useMessageThread(userId1: number, userId2: number, charterId?: number) {
  return useQuery<Message[]>({
    queryKey: ["/api/messages/thread", userId1, userId2, charterId],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("userId1", userId1.toString());
      params.set("userId2", userId2.toString());
      if (charterId) params.set("charterId", charterId.toString());
      
      const response = await fetch(`/api/messages/thread?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch message thread");
      return response.json();
    },
    enabled: !!userId1 && !!userId2,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { 
      senderId: number; 
      receiverId: number; 
      content: string; 
      charterId?: number 
    }) => {
      return apiRequest("POST", "/api/messages", data);
    },
    onSuccess: (_, variables) => {
      // Invalidate message thread queries
      queryClient.invalidateQueries({ 
        queryKey: ["/api/messages/thread", variables.senderId, variables.receiverId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/messages/thread", variables.receiverId, variables.senderId] 
      });
      
      // Invalidate thread lists for both users
      queryClient.invalidateQueries({ 
        queryKey: [`/api/messages/threads/${variables.senderId}`] 
      });
      queryClient.invalidateQueries({ 
        queryKey: [`/api/messages/threads/${variables.receiverId}`] 
      });
    },
  });
}

export function useMarkMessageAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageId: number) => {
      return apiRequest("PATCH", `/api/messages/${messageId}/read`, {});
    },
    onSuccess: () => {
      // Invalidate all message-related queries to update read status
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
    },
  });
}
