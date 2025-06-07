import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/header";
import MessageThread from "@/components/message-thread";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, User } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { MessageThread as MessageThreadType, Message } from "@shared/schema";

// Mock current user ID - in a real app this would come from auth
const CURRENT_USER_ID = 1;

export default function Messages() {
  const [selectedThread, setSelectedThread] = useState<MessageThreadType | null>(null);
  const queryClient = useQueryClient();

  const { data: threads, isLoading } = useQuery<MessageThreadType[]>({
    queryKey: [`/api/messages/threads/${CURRENT_USER_ID}`],
  });

  const { data: messages } = useQuery<Message[]>({
    queryKey: ["/api/messages/thread", CURRENT_USER_ID, selectedThread?.participant.id],
    queryFn: async () => {
      if (!selectedThread) return [];
      const params = new URLSearchParams({
        userId1: CURRENT_USER_ID.toString(),
        userId2: selectedThread.participant.id.toString(),
      });
      const response = await fetch(`/api/messages/thread?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch messages");
      return response.json();
    },
    enabled: !!selectedThread,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { receiverId: number; content: string; charterId?: number }) => {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          senderId: CURRENT_USER_ID,
          ...data,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to send message");
      }
      
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/messages/thread", CURRENT_USER_ID, variables.receiverId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: [`/api/messages/threads/${CURRENT_USER_ID}`] 
      });
    },
  });

  const handleSendMessage = (content: string) => {
    if (!selectedThread) return;
    
    sendMessageMutation.mutate({
      receiverId: selectedThread.participant.id,
      content,
    });
  };

  // Auto-select first thread if none selected
  useEffect(() => {
    if (threads && threads.length > 0 && !selectedThread) {
      setSelectedThread(threads[0]);
    }
  }, [threads, selectedThread]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">Messages</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
          {/* Thread List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageCircle className="w-5 h-5 mr-2" />
                Conversations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="space-y-4 p-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center space-x-3 animate-pulse">
                      <div className="w-12 h-12 bg-gray-200 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                        <div className="h-3 bg-gray-200 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : threads?.length === 0 ? (
                <div className="p-8 text-center text-storm-gray">
                  <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No conversations yet.</p>
                  <p className="text-sm">Start messaging captains to book your next trip!</p>
                </div>
              ) : (
                <div className="divide-y">
                  {threads?.map((thread) => (
                    <button
                      key={thread.participant.id}
                      onClick={() => setSelectedThread(thread)}
                      className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                        selectedThread?.participant.id === thread.participant.id ? "bg-blue-50" : ""
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback>
                            <User className="w-4 h-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold truncate">
                              {thread.participant.firstName} {thread.participant.lastName}
                            </h3>
                            {thread.unreadCount > 0 && (
                              <Badge variant="secondary" className="bg-ocean-blue text-white">
                                {thread.unreadCount}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-storm-gray truncate">
                            {thread.lastMessage.content}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(thread.lastMessage.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Message Thread */}
          <Card className="lg:col-span-2">
            {selectedThread ? (
              <MessageThread
                participant={selectedThread.participant}
                messages={messages || []}
                currentUserId={CURRENT_USER_ID}
                onSendMessage={handleSendMessage}
                isLoading={sendMessageMutation.isPending}
              />
            ) : (
              <CardContent className="flex items-center justify-center h-full">
                <div className="text-center text-storm-gray">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Select a conversation to start messaging</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
