import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface Message {
  id?: number;               // puede no venir en el optimista
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;        // ISO string del backend
  _optimistic?: boolean;     // marca local
}

interface Participant {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  avatar?: string | null;
  profileImageUrl?: string | null; // backward compatibility
}

interface Props {
  participant: Participant;
  messages: Message[];
  currentUserId: string;
  onSendMessage: (content: string, onError: () => void) => void;
  isLoading: boolean;
}

export default function MessageThread({
  participant,
  messages,
  currentUserId,
  onSendMessage,
  isLoading,
}: Props) {
  const [newMessage, setNewMessage] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const content = newMessage.trim();
    if (!content) return;

    // Si falla, NO limpiamos el input:
    onSendMessage(content, () => {
      // onError -> dejamos el contenido tal cual
    });

    // Si todo va bien, el padre limpiará el input via state lifting, aquí lo limpiamos por UX
    setNewMessage("");
  };

  return (
    <div className="flex flex-col h-[600px]">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-storm-gray mt-20">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMine = String(msg.sender_id) === String(currentUserId);
            const created = msg.created_at ? new Date(msg.created_at) : null;

            return (
              <div
                key={msg.id ?? `optimistic-${idx}`}
                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    isMine
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-900"
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                  <span className="block text-xs mt-1 opacity-70">
                    {created && !isNaN(created.getTime())
                      ? created.toLocaleString()
                      : ""}
                    {msg._optimistic ? " • sending…" : ""}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="p-3 border-t flex items-center space-x-2"
      >
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 border rounded-lg px-3 py-2 text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              (e.currentTarget.form as HTMLFormElement)?.requestSubmit();
            }
          }}
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Sending…" : "Send"}
        </Button>
      </form>
    </div>
  );
}

