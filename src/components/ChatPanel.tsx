import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type Msg = { id: string; user_id: string; username: string | null; message: string; created_at: string };

const EMOJIS = ["💼", "📊", "⚔️", "🤝", "🏆"];

export function ChatPanel({ gameId }: { gameId: string }) {
  const { user, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [unread, setUnread] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    supabase
      .from("chat_messages")
      .select("*")
      .eq("game_id", gameId)
      .order("created_at", { ascending: true })
      .limit(100)
      .then(({ data }) => {
        if (active && data) setMessages(data as Msg[]);
      });
    const channel = supabase
      .channel(`chat:${gameId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `game_id=eq.${gameId}` },
        (payload) => {
          setMessages((m) => [...m, payload.new as Msg]);
          if (!open) setUnread((u) => u + 1);
        }
      )
      .subscribe();
    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [gameId, open]);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => scrollRef.current?.scrollTo({ top: 999999 }), 50);
    }
  }, [open, messages.length]);

  const send = async (msg: string) => {
    const m = msg.trim().slice(0, 200);
    if (!m || !user) return;
    setText("");
    await supabase.from("chat_messages").insert({
      game_id: gameId,
      user_id: user.id,
      username: profile?.username ?? null,
      message: m,
    });
  };

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-24 md:bottom-6 right-4 z-50 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg glow-gold flex items-center justify-center"
        aria-label="Toggle chat"
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 h-5 min-w-5 rounded-full bg-destructive text-xs flex items-center justify-center px-1">
            {unread}
          </span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-40 md:bottom-20 right-4 z-50 w-80 max-w-[calc(100vw-2rem)] h-96 bg-card border border-border rounded-xl shadow-2xl flex flex-col"
          >
            <div className="p-3 border-b border-border text-sm font-semibold flex items-center justify-between">
              <span>Boardroom Chat</span>
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 text-sm">
              {messages.length === 0 ? (
                <p className="text-muted-foreground text-xs text-center mt-4">No messages yet. Open the negotiation.</p>
              ) : (
                messages.map((m) => (
                  <div key={m.id} className={cn("flex flex-col", m.user_id === user?.id ? "items-end" : "items-start")}>
                    <div className="text-[10px] text-muted-foreground">{m.username ?? "Anon"}</div>
                    <div
                      className={cn(
                        "rounded-lg px-2.5 py-1.5 max-w-[80%] break-words",
                        m.user_id === user?.id ? "bg-primary text-primary-foreground" : "bg-background border border-border"
                      )}
                    >
                      {m.message}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="border-t border-border p-2 flex gap-1">
              {EMOJIS.map((e) => (
                <button key={e} onClick={() => send(e)} className="hover:scale-125 transition-transform text-lg">
                  {e}
                </button>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(text);
              }}
              className="border-t border-border p-2 flex gap-2"
            >
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={200}
                placeholder="Type..."
                className="flex-1 bg-background border border-border rounded-md px-2 py-1.5 text-sm focus:outline-none focus:border-gold"
              />
              <button type="submit" className="h-8 w-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center">
                <Send className="h-4 w-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
