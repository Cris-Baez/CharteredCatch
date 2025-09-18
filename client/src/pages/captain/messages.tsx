// client/src/pages/captain/messages.tsx
import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import HeaderCaptain from "@/components/headercaptain";
import MessageThread from "@/components/message-thread";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MessageCircle, Search } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { fetchWithCsrf } from "@/lib/csrf";

/* ===== tipos que matchean tu backend ===== */
type SnakeMessage = {
  id: number;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;       // ISO
  charter_id?: number | null;
  read?: boolean | null;
  _optimistic?: boolean;    // local
};

type Thread = {
  participant: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    avatar?: string | null;         // por si luego lo agregas
  };
  // en tu backend actual no llega bookingId/charterId aquí, así que los omitimos
  lastMessage?: {
    content: string;
    created_at: string;
  };
  unreadCount?: number;
};

export default function MessagesCaptain() {
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [optimistic, setOptimistic] = useState<SnakeMessage[]>([]);
  const [q, setQ] = useState("");
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();

  const me = String(user?.id || "");

  /* ====== THREADS (lista de conversaciones) ====== */
  const { data: threads, isLoading: loadingThreads } = useQuery<Thread[]>({
    queryKey: [`/api/messages/threads/${me}`],
    enabled: isAuthenticated && !!me,
    queryFn: async () => {
      const res = await fetch(`/api/messages/threads/${encodeURIComponent(me)}`, {
        credentials: "include",
      });
      if (!res.ok) {
        const txt = await res.text();
        console.error("Threads fetch failed:", res.status, txt);
        throw new Error("Failed to fetch threads");
      }
      return res.json();
    },
    staleTime: 30_000,
  });

  /* ====== MENSAJES DE UN THREAD ====== */
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
    staleTime: 10_000,
  });

  /* ====== MARCAR COMO LEÍDO AL ABRIR ====== */
  const markRead = useMutation({
    mutationFn: async (payload: { userId: string; participantId: string }) => {
      const res = await fetchWithCsrf("/api/messages/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/messages/threads/${me}`] });
    },
  });

  useEffect(() => {
    if (selectedThread && me) {
      markRead.mutate({ userId: me, participantId: String(selectedThread.participant.id) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedThread?.participant.id]);

  /* ====== MERGE server + optimistas ====== */
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
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }, [serverMessages, optimistic, selectedThread, me]);

  /* ====== ENVIAR MENSAJE (optimista) ====== */
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
        credentials: "include",
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
      // quitar optimista que coincide
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
      // refrescar thread y lista
      queryClient.invalidateQueries({
        queryKey: ["/api/messages/thread", me, variables.receiverId],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/messages/threads/${me}`],
      });
    },
    onError: (err) => console.error("Send error:", err),
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

    // 2) enviar
    sendMessageMutation.mutate(
      { receiverId: receiver, content },
      {
        onError: () => {
          // quitar optimista y devolver texto al input
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

  /* ====== auto-seleccionar primer thread ====== */
  useEffect(() => {
    if ((threads?.length ?? 0) > 0 && !selectedThread) {
      setSelectedThread(threads![0]);
    }
  }, [threads, selectedThread]);

  /* ====== filtros y helpers UI ====== */
  const initials = (fn?: string | null, ln?: string | null) => {
    const a = (fn?.[0] || "").toUpperCase();
    const b = (ln?.[0] || "").toUpperCase();
    return (a + b || "G").slice(0, 2);
  };

  const filteredThreads = useMemo(() => {
    const text = q.trim().toLowerCase();
    if (!text) return threads || [];
    return (threads || []).filter((t) => {
      const name = [t.participant.firstName, t.participant.lastName].filter(Boolean).join(" ");
      const last = t.lastMessage?.content || "";
      return [name, last].join(" ").toLowerCase().includes(text);
    });
  }, [threads, q]);

  return (
    <div className="min-h-screen bg-background">
      <HeaderCaptain />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">Messages</h1>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-storm-gray" size={18} />
          <Input
            placeholder="Search conversations…"
            className="pl-10"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

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
              ) : (filteredThreads.length === 0) ? (
                <div className="p-8 text-center text-storm-gray">
                  <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No conversations yet.</p>
                  <p className="text-sm">Messages from guests will appear here.</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredThreads.map((thread) => {
                    const name =
                      [thread.participant.firstName, thread.participant.lastName]
                        .filter(Boolean)
                        .join(" ") || `Guest #${thread.participant.id}`;
                    return (
                      <button
                        key={thread.participant.id}
                        onClick={() => setSelectedThread(thread)}
                        className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                          selectedThread?.participant.id === thread.participant.id ? "bg-blue-50" : ""
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            {thread.participant.avatar ? (
                              <AvatarImage src={thread.participant.avatar} />
                            ) : (
                              <AvatarFallback>
                                {initials(thread.participant.firstName, thread.participant.lastName)}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold truncate">{name}</h3>
                              {(thread.unreadCount ?? 0) > 0 && (
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
                                No messages yet
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
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

