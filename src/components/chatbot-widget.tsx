"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, X, Send, Bot, Loader2 } from "lucide-react";

type Message = {
  role: "user" | "bot";
  content: string;
  confidence?: number;
};

const SUGGESTED_QUESTIONS = [
  "Quelle est la date de péremption ?",
  "Quels sont les ingrédients ?",
  "D'où vient ce produit ?",
  "Est-ce un produit sûr ?",
];

export function ChatbotWidget({ productId }: { productId: string }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      content: "Bonjour ! Je suis l'assistant IA VerifScan. Posez-moi une question sur ce produit (ingrédients, fraîcheur, origine, sécurité).",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function send(question?: string) {
    const q = question || input;
    if (!q.trim() || loading) return;
    setInput("");
    setLoading(true);

    const userMsg: Message = { role: "user", content: q };
    setMessages((m) => [...m, userMsg]);

    try {
      const res = await fetch("/api/ai/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, question: q }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages((m) => [
          ...m,
          {
            role: "bot",
            content: data.answer,
            confidence: data.confidence,
          },
        ]);
      } else {
        setMessages((m) => [
          ...m,
          { role: "bot", content: "Désolé, je n'ai pas pu traiter votre demande." },
        ]);
      }
    } catch {
      setMessages((m) => [
        ...m,
        { role: "bot", content: "Erreur de connexion. Réessayez." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg hover:scale-105 transition-transform flex items-center justify-center"
        aria-label="Chatbot IA"
      >
        {open ? <X className="size-6" /> : <MessageSquare className="size-6" />}
        {!open && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 border-2 border-white" />
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <Card className="fixed bottom-20 right-4 z-50 w-[calc(100vw-2rem)] sm:w-96 max-h-[70vh] flex flex-col shadow-2xl border-emerald-200">
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-3 rounded-t-lg flex items-center gap-2">
            <Bot className="size-5" />
            <div className="flex-1">
              <p className="font-semibold text-sm">Assistant IA VerifScan</p>
              <p className="text-xs text-emerald-100">Posez vos questions sur ce produit</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-emerald-100 hover:text-white">
              <X className="size-4" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto vs-scroll p-3 space-y-2 bg-emerald-50/30">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] p-2.5 rounded-lg text-sm ${
                    m.role === "user"
                      ? "bg-emerald-600 text-white"
                      : "bg-white border border-emerald-100 text-gray-700"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>
                  {m.confidence !== undefined && m.confidence < 80 && (
                    <p className="text-[10px] mt-1 opacity-70">Confiance : {m.confidence}%</p>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-emerald-100 p-2.5 rounded-lg flex items-center gap-1">
                  <Loader2 className="size-3 animate-spin text-emerald-500" />
                  <Loader2 className="size-3 animate-spin text-emerald-500" style={{ animationDelay: "0.1s" }} />
                  <Loader2 className="size-3 animate-spin text-emerald-500" style={{ animationDelay: "0.2s" }} />
                </div>
              </div>
            )}

            {/* Suggested questions (only show at start) */}
            {messages.length === 1 && !loading && (
              <div className="space-y-1 pt-2">
                <p className="text-xs text-gray-500 px-1">Questions fréquentes :</p>
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    className="block w-full text-left text-xs text-emerald-700 hover:bg-emerald-50 p-2 rounded border border-emerald-100"
                  >
                    💬 {q}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-emerald-100 p-2 flex gap-1 bg-white">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Tapez votre question..."
              className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-emerald-400"
              disabled={loading}
            />
            <Button size="sm" onClick={() => send()} disabled={loading || !input.trim()}>
              <Send className="size-3.5" />
            </Button>
          </div>
        </Card>
      )}
    </>
  );
}
