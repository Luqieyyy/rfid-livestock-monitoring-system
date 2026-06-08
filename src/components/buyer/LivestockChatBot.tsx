'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTED_QUESTIONS = [
  'What is the difference between Brahman and Kedah-Kelantan cattle?',
  'How do I evaluate a cow before buying?',
  'What is the estimated price for a 200kg cow?',
  'What are the signs of a healthy cow?',
];

export default function LivestockChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: 'Hello! I\'m FarmSense AI Assistant 🐄\n\nI can help you with:\n• Cattle & goat breeds\n• Tips for buying livestock\n• Health & care\n• Slaughter yield estimation\n\nAny questions?',
        },
      ]);
    }
  }, [open, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || loading) return;

    const userMessage: Message = { role: 'user', content: messageText };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.reply || data.error || 'Error getting response.' },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Connection error. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Chat Window */}
      {open && (
        <div className="fixed inset-x-3 bottom-24 z-50 flex h-[min(680px,calc(100dvh-7rem))] max-h-[calc(100dvh-7rem)] flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-2xl sm:inset-x-auto sm:right-5 sm:bottom-24 sm:w-[min(430px,calc(100vw-2.5rem))] md:w-[440px] lg:right-8 lg:bottom-28">
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl">
                <img src="/farmsensechatbotai.png" alt="FarmSense AI" className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white sm:text-base">FarmSense AI</p>
                <p className="truncate text-xs text-cyan-100">Livestock Expert</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="shrink-0 rounded-lg p-2 transition-colors hover:bg-white/20"
              aria-label="Close chatbot"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-slate-100 p-3 sm:p-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap sm:max-w-[82%] sm:px-4 ${
                    msg.role === 'user'
                      ? 'bg-cyan-600 text-white rounded-br-sm'
                      : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm shadow-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Questions (show only at start) */}
          {messages.length === 1 && (
            <div className="shrink-0 border-t border-gray-100 bg-gray-50 px-3 py-2">
              <p className="mb-2 text-xs text-gray-400">Popular questions:</p>
              <div className="grid gap-1.5 sm:grid-cols-1">
                {SUGGESTED_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(q)}
                    className="rounded-xl border border-cyan-100 bg-white px-3 py-2 text-left text-xs leading-snug text-cyan-700 transition-colors hover:bg-cyan-50"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="shrink-0 border-t border-gray-100 bg-white p-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Ask about livestock..."
                className="min-w-0 flex-1 rounded-xl border-0 bg-gray-50 px-4 py-2.5 text-sm outline-none transition-all focus:bg-white focus:ring-2 focus:ring-cyan-500"
                disabled={loading}
              />
              <button
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                className="shrink-0 rounded-xl bg-cyan-600 p-2.5 text-white transition-colors hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Send message"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <p className="mt-2 text-center text-[11px] text-gray-400 sm:text-xs">Restricted to livestock & buying topics only</p>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-lg transition-all hover:scale-105 hover:shadow-xl sm:bottom-6 sm:right-6 sm:h-16 sm:w-16"
        aria-label={open ? 'Close FarmSense AI chatbot' : 'Open FarmSense AI chatbot'}
      >
        {open ? (
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <img src="/farmsensechatbotai.png" alt="FarmSense AI" className="w-full h-full object-cover" />
        )}
      </button>
    </>
  );
}
