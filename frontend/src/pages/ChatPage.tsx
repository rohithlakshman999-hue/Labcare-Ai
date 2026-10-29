import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  MessageSquare,
  Send,
  Trash2,
  Bot,
  User,
  BookOpen,
  Monitor,
  ShieldAlert,
  Sparkles,
  Info
} from 'lucide-react';

import { api } from '../services/api';
import { Device } from '../types';
import { DemoBadge } from '../components/common/DemoBadge';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{ doc_id: string; title: string; source: string }>;
  isFallback?: boolean;
}

export const ChatPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const preselectedDevice = searchParams.get('device_id') || '';

  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>(preselectedDevice);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Hello! I am the **LabCare AI Assistant**. I provide evidence-based troubleshooting, fault explanations, guided verification instructions, and safe repair guidance for college lab computers.\n\nHow can I help you today?',
      isFallback: true
    }
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.getDevices().then(setDevices).catch(console.error);
    if (preselectedDevice) {
      setSelectedDevice(preselectedDevice);
    }
  }, [preselectedDevice]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const userText = input.trim();
    setInput('');

    const newMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userText
    };
    setMessages((prev) => [...prev, newMsg]);

    try {
      setSending(true);
      const res = await api.sendMessage(userText, 'default_session', selectedDevice || undefined);
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.reply,
        sources: res.sources,
        isFallback: res.is_fallback
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Error communicating with troubleshooting assistant. Please check backend connection.'
        }
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleClearHistory = async () => {
    try {
      await api.clearChatHistory('default_session');
      setMessages([
        {
          id: 'welcome_reset',
          role: 'assistant',
          content: 'Chat session reset. Ready for new troubleshooting queries.',
          isFallback: true
        }
      ]);
    } catch (e) {
      console.error(e);
    }
  };

  const quickPrompts = [
    'How do I troubleshoot high CPU usage on a student computer?',
    'What should I check when a workstation has low disk space?',
    'Workstation in Lab A is showing ethernet network disconnect.',
    'Explain the difference between observed evidence and model hypothesis.'
  ];

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col max-w-5xl mx-auto bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Chat Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-600 text-white shadow-xs">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 tracking-tight">AI Troubleshooting Assistant</h1>
              <DemoBadge size="sm" />
            </div>
            <p className="text-xs text-slate-500">
              Evidence-based RAG reasoning over approved campus IT Standard Operating Procedures.
            </p>
          </div>
        </div>

        {/* Device Context Picker & Clear */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs bg-white px-2.5 py-1 rounded-lg border border-slate-300">
            <Monitor className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-semibold text-slate-600">Context:</span>
            <select
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className="text-xs font-bold text-blue-600 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="">No Workstation Context</option>
              {devices.map((d) => (
                <option key={d.device_id} value={d.device_id}>
                  {d.device_id} ({d.display_name})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleClearHistory}
            title="Clear Chat History"
            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 text-xs shadow-xs">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-2xl rounded-xl p-4 text-xs leading-relaxed ${
                m.role === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-none shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-xs space-y-2'
              }`}
            >
              <div className="whitespace-pre-wrap">{m.content}</div>

              {m.sources && m.sources.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1">
                  <p className="font-bold text-[11px] text-slate-600 flex items-center gap-1">
                    <BookOpen className="w-3 h-3 text-blue-600" />
                    Referenced Knowledge Base Procedures:
                  </p>
                  {m.sources.map((s, idx) => (
                    <div key={idx} className="text-[11px] text-slate-500 bg-slate-50 px-2 py-1 rounded">
                      <strong className="text-slate-800">{s.title}</strong> ({s.doc_id}) — <em>{s.source}</em>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {m.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center shrink-0 text-xs shadow-xs font-bold">
                IT
              </div>
            )}
          </div>
        ))}

        {sending && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-500">
              Analyzing telemetry and consulting troubleshooting knowledge base...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      {messages.length <= 2 && (
        <div className="px-5 py-2 bg-slate-50 border-t border-slate-200 flex flex-wrap gap-2">
          {quickPrompts.map((p, i) => (
            <button
              key={i}
              onClick={() => setInput(p)}
              className="text-[11px] text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md transition-colors text-left"
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Chat Input Bar */}
      <form onSubmit={handleSend} className="p-3.5 border-t border-slate-200 bg-white flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            selectedDevice
              ? `Ask a troubleshooting question for ${selectedDevice}...`
              : 'Ask an IT diagnostics or repair procedure question...'
          }
          className="flex-1 text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
        >
          <Send className="w-3.5 h-3.5" />
          Send
        </button>
      </form>
    </div>
  );
};
