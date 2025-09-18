import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import HeaderUser from "@/components/headeruser";
import MessageThread from "@/components/message-thread";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { CharterWithCaptain } from "@shared/schema";
import { fetchWithCsrf } from "@/lib/csrf";

type SnakeMessage = {
  id: number;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  charter_id?: number | null;
  read?: boolean | null;
  _optimistic?: boolean; // local client only
};

interface Thread {
  participant: {
    id: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
  };
  bookingId?: number;
  charterId?: number;
  lastMessage?: {
    content: string;
    created_at: string;
  };
  unreadCount?: number;
}

interface Booking {
  id: number;
  charterId: number;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  charter?: CharterWithCaptain;
}

export default function MessagesUser() {
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [optimistic, setOptimistic] = useState<SnakeMessage[]>([]);
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();

  const me = String(user?.id || "");

  // BOOKINGS DEL USUARIO
  const { data: bookings } = useQuery<Booking[]>({
    queryKey: ["bookings", "me"],
    queryFn: async () => {
      const res = await fetch("/api/bookings/me", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch bookings");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  // THREADS DEL BACKEND
  const { data: threads, isLoading: loadingThreads } = useQuery<Thread[]>({
    queryKey: [`/api/messages/threads/${me}`],
    enabled: isAuthenticated && !!me,
    queryFn: async () => {
      const res = await fetch(`/api/messages/threads/${me}`, {
        credentials: "include",
      });
      if (!res.ok) {
        const txt = await res.text();
        console.error("Threads fetch failed:", res.status, txt);
        throw new Error("Failed to fetch threads");
      }
      return res.json();
    },
  });

  // COMBINAR BOOKINGS + THREADS
  const combinedThreads: Thread[] = useMemo(() => {
    const bookingThreads: Thread[] =
      bookings?.map((b) => ({
        participant: {
          id: String(b.charter?.captain?.userId || `captain-${b.charterId}`),
          firstName: b.charter?.captain?.name?.split(" ")[0],
          lastName: b.charter?.captain?.name?.split(" ").slice(1).join(" "),
          profileImageUrl: b.charter?.captain?.avatar || undefined,
        },
        bookingId: b.id,
        charterId: b.charterId,
        lastMessage: undefined,
        unreadCount: 0,
      })) || [];

    const all = [...(threads || []), ...bookingThreads];

    // evitar duplicados por participant.id
    const map = new Map<string, Thread>();
    for (const t of all) {
      const key = String(t.participant.id);
      if (!map.has(key)) map.set(key, { ...t, participant: { ...t.participant, id: key } });
    }
    return Array.from(map.values());
  }, [threads, bookings]);

  // MENSAJES DE UN THREAD
  const { data: serverMessages } = useQuery<SnakeMessage[]>({
    queryKey: ["/api/messages/thread", me, selectedThread?.participant.id],
    queryFn: async () => {
      if (!selectedThread || !me) return [];
      const params = new URLSearchParams({
        userId1: me,
        userId2: String(selectedThread.participant.id),
      });
      const res = await fetch(`/api/messages/thread?${params.toString()}`, {
        credentials: "include",
      });
      if (!res.ok) {
        const txt = await res.text();
        console.error("Thread fetch failed:", res.status, txt);
        throw new Error("Failed to fetch messages");
      }
      return res.json();
    },
    enabled: !!selectedThread && isAuthenticated && !!me,
  });

  // Mensajes que se muestran = server + optimistas
  const mergedMessages: SnakeMessage[] = useMemo(() => {
    if (!selectedThread) return [];
    const partner = String(selectedThread.participant.id);
    const fromServer = (serverMessages || []).filter(
      (m) =>
        (m.sender_id === me && m.receiver_id === partner) ||
        (m.sender_id === partner && m.receiver_id === me)
    );
    const local = optimistic.filter(
      (m) =>
        (m.sender_id === me && m.receiver_id === partner) ||
        (m.sender_id === partner && m.receiver_id === me)
    );
    return [...fromServer, ...local].sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }, [serverMessages, optimistic, selectedThread, me]);

  // ENVIAR MENSAJE
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { receiverId: string; content: string; charterId?: number }) => {
      const payload: any = {
        receiverId: String(data.receiverId),
        content: data.content,
      };
      if (data.charterId != null) payload.charterId = data.charterId;

      const res = await fetchWithCsrf("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // NECESARIO para req.session.userId
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text();
        console.error("Send failed:", res.status, txt);
        throw new Error(txt || "Failed to send message");
      }
      return res.json() as Promise<SnakeMessage>;
    },
    onSuccess: (saved, variables) => {
      // quitamos el optimista correspondiente al contenido si existía
      setOptimistic((prev) =>
        prev.filter(
          (m) =>
            !(
              m._optimistic &&
              m.content === saved.content &&
              m.receiver_id === String(variables.receiverId) &&
              m.sender_id === me
            )
        )
      );

      // refrescamos
      queryClient.invalidateQueries({
        queryKey: ["/api/messages/thread", me, variables.receiverId],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/messages/threads/${me}`],
      });
    },
    onError: (err) => {
      console.error("Send error:", err);
    },
  });

  const handleSendMessage = (content: string, onError: () => void) => {
    if (!selectedThread) return;
    const receiver = String(selectedThread.participant.id);

    // 1) optimista
    const optimisticMsg: SnakeMessage = {
      id: Math.floor(Math.random() * 1_000_000) * -1, // id temporal negativo
      sender_id: me,
      receiver_id: receiver,
      content,
      created_at: new Date().toISOString(),
      _optimistic: true,
    };
    setOptimistic((prev) => [...prev, optimisticMsg]);

    // 2) enviar real
    sendMessageMutation.mutate(
      {
        receiverId: receiver,
        charterId: selectedThread.charterId,
        content,
      },
      {
        onError: () => {
          // quitamos el optimista y devolvemos el contenido al input
          setOptimistic((prev) =>
            prev.filter(
              (m) =>
                !(
                  m._optimistic &&
                  m.content === content &&
                  m.receiver_id === receiver &&
                  m.sender_id === me
                )
            )
          );
          onError();
        },
      }
    );
  };

  // AUTO-SELECCIONAR
  useEffect(() => {
    if (combinedThreads.length > 0 && !selectedThread) {
      setSelectedThread(combinedThreads[0]);
    }
  }, [combinedThreads, selectedThread]);

  return (
    <div className="min-h-screen bg-background">
      <HeaderUser />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">Messages</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:h-[600px]">
          {/* LISTA DE THREADS */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageCircle className="w-5 h-5 mr-2" />
                Conversations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loadingThreads ? (
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
              ) : combinedThreads.length === 0 ? (
                <div className="p-8 text-center text-storm-gray">
                  <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No conversations yet.</p>
                  <p className="text-sm">Book a trip to start chatting with captains!</p>
                </div>
              ) : (
                <div className="divide-y">
                  {combinedThreads.map((thread) => (
                    <button
                      key={thread.participant.id}
                      onClick={() => setSelectedThread(thread)}
                      className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                        selectedThread?.participant.id === thread.participant.id
                          ? "bg-blue-50"
                          : ""
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          {thread.participant.profileImageUrl ? (
                            <AvatarImage src={thread.participant.profileImageUrl} />
                          ) : (
                            <AvatarFallback>
                              {thread.participant.firstName?.[0] ||
                                thread.participant.lastName?.[0] ||
                                "C"}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold truncate">
                              {thread.participant.firstName ||
                                thread.participant.lastName ||
                                `Captain #${thread.participant.id}`}
                            </h3>
                            {thread.unreadCount && thread.unreadCount > 0 && (
                              <Badge variant="secondary" className="bg-ocean-blue text-white">
                                {thread.unreadCount}
                              </Badge>
                            )}
                          </div>
                          {thread.lastMessage ? (
                            <>
                              <p className="text-sm text-storm-gray truncate">
                                {thread.lastMessage.content}
                              </p>
                              <p className="text-xs text-gray-400">
                                {new Date(thread.lastMessage.created_at).toLocaleString()}
                              </p>
                            </>
                          ) : (
                            <p className="text-sm text-storm-gray italic truncate">
                              {bookings?.find((b) => b.charterId === thread.charterId)?.status ||
                                "No messages yet"}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* THREAD SELECCIONADO */}
          <Card className="lg:col-span-2">
            {selectedThread ? (
              <MessageThread
                participant={selectedThread.participant}
                messages={mergedMessages}
                currentUserId={me}
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

