import React, { useState, useEffect, useRef } from 'react';
import Markdown from 'react-markdown';
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  Minimize2, 
  Maximize2, 
  RotateCcw, 
  Copy, 
  Check, 
  Key, 
  AlertCircle, 
  CheckCircle2, 
  Plus, 
  ChevronDown, 
  ChevronUp,
  MessageSquare,
  HelpCircle,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { Project, Agency, ChatInlineChartData } from '../types';
import { 
  streamGeminiEnterpriseAgent, 
  DEFAULT_GEMINI_ENTERPRISE_CONFIG,
  refreshOAuthAccessToken,
  getEffectiveAccessToken,
  hasOAuthCredentials
} from '../lib/geminiEnterprise';
import { logSubmission } from '../lib/firebase';
import { ChatInlineChart } from './ChatInlineChart';
import { extractChartDataFromResponse } from '../utils/chatChartExtractor';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  isStreaming?: boolean;
  statusText?: string;
  error?: boolean;
  canCreateProject?: boolean;
  chart?: ChatInlineChartData;
}

interface ChatbotWidgetProps {
  projects: Project[];
  agencies: Agency[];
  onOpenCreateProject?: (initialData?: Partial<Project>) => void;
  isOpenExternal?: boolean;
  onToggleExternal?: () => void;
}

export const ChatbotWidget: React.FC<ChatbotWidgetProps> = ({
  projects,
  agencies,
  onOpenCreateProject,
  isOpenExternal,
  onToggleExternal
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  // Access Token State synced with localStorage
  const [accessToken, setAccessToken] = useState<string>(() => {
    return localStorage.getItem('gemini_enterprise_token') || DEFAULT_GEMINI_ENTERPRISE_CONFIG.defaultToken || '';
  });
  const [showTokenSettings, setShowTokenSettings] = useState<boolean>(false);
  const [tempToken, setTempToken] = useState<string>(accessToken);
  const [isRefreshingToken, setIsRefreshingToken] = useState<boolean>(false);

  const handleManualRefreshToken = async () => {
    setIsRefreshingToken(true);
    try {
      const newToken = await refreshOAuthAccessToken();
      if (newToken) {
        setAccessToken(newToken);
        setTempToken(newToken);
      }
    } catch (err: any) {
      console.warn('Chatbot token refresh notice:', err);
    } finally {
      setIsRefreshingToken(false);
    }
  };

  // Messages State with LocalStorage persistence
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('kpsti_chatbot_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        // ignore fallback
      }
    }
    return [
      {
        id: 'msg-welcome',
        sender: 'assistant',
        text: `Salam sejahtera! Saya **Pembantu Pintar KPSTI (Gemini Enterprise Agent)**.

Saya boleh membantu anda untuk:
* 📊 **Menyemak status inisiatif & projek** merentasi agensi kerajaan Sabah.
* ⚠️ **Mengenal pasti isu penghalang & projek tertunggak**.
* 💡 **Merangka inisiatif strategik baharu** berasaskan kecerdasan buatan.
* 🔍 **Menjawab soalan berkaitan perkhidmatan awam & digital Sabah**.

Ada sebarang pertanyaan yang boleh saya bantu hari ini?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Handle external toggle from Navbar
  useEffect(() => {
    if (isOpenExternal !== undefined) {
      setIsOpen(isOpenExternal);
    }
  }, [isOpenExternal]);

  // Sync token from localStorage if updated elsewhere in app
  useEffect(() => {
    const handleStorageChange = () => {
      const stored = localStorage.getItem('gemini_enterprise_token');
      if (stored) {
        setAccessToken(stored);
        setTempToken(stored);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Persist messages
  useEffect(() => {
    try {
      localStorage.setItem('kpsti_chatbot_history', JSON.stringify(messages));
    } catch (e) {
      // ignore
    }
  }, [messages]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isGenerating]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleToggle = () => {
    if (onToggleExternal) {
      onToggleExternal();
    } else {
      setIsOpen(prev => !prev);
    }
  };

  const handleSaveToken = () => {
    const clean = tempToken.trim();
    setAccessToken(clean);
    localStorage.setItem('gemini_enterprise_token', clean);
    setShowTokenSettings(false);
  };

  const handleClearHistory = () => {
    const defaultMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      text: 'Sesi perbualan telah dikosongkan. Sila ajukan soalan atau pilih salah satu cadangan di bawah untuk bermula.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages([defaultMsg]);
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  // Helper to answer local project queries directly if user asks about loaded data
  const tryAnswerFromLocalData = (query: string): string | null => {
    const q = query.toLowerCase();
    
    // Check if asking about project statistics
    if (q.includes('berapa projek') || q.includes('jumlah projek') || q.includes('statistik') || q.includes('status projek')) {
      const total = projects.length;
      const completed = projects.filter(p => p.status === 'Completed').length;
      const inProgress = projects.filter(p => p.status === 'In Progress').length;
      const delayed = projects.filter(p => p.status === 'Delayed').length;
      const planning = projects.filter(p => p.status === 'Planning').length;
      const avgProgress = total > 0 ? Math.round(projects.reduce((acc, p) => acc + (p.progressPercentage || 0), 0) / total) : 0;

      return `### 📊 Ringkasan Status Projek Terkini (KPSTI)

Pangkalan data Firestore kini merekodkan **${total} inisiatif berdaftar**:
* ✅ **Selesai (Completed)**: ${completed} projek
* ⏳ **Sedang Berjalan (In Progress)**: ${inProgress} projek
* ⚠️ **Tertunggak (Delayed)**: ${delayed} projek
* 📋 **Perancangan (Planning)**: ${planning} projek
* 📈 **Purata Kemajuan Keseluruhan**: ${avgProgress}%

${delayed > 0 ? `\n> ⚠️ Terdapat **${delayed} projek lewat** yang memerlukan intervensi segera. Taip *"projek lewat"* untuk senarai terperinci.` : ''}`;
    }

    // Check if asking specifically about delayed projects
    if (q.includes('lewat') || q.includes('tertunggak') || q.includes('delayed') || q.includes('isu penghalang') || q.includes('blocker')) {
      const delayedProjects = projects.filter(p => p.status === 'Delayed');
      if (delayedProjects.length === 0) {
        return `### ✅ Tiada Projek Tertunggak\n\nSemua **${projects.length} inisiatif** kini berada dalam keadaan lancar (On Track / Completed). Tiada status *Delayed* dilaporkan.`;
      }

      let resp = `### ⚠️ Senarai Projek Tertunggak & Isu Penghalang (${delayedProjects.length} Projek)\n\n`;
      delayedProjects.forEach((p, idx) => {
        resp += `${idx + 1}. **${p.title}** (${p.leadAgency})\n`;
        resp += `   * **Kemajuan**: ${p.progressPercentage}%\n`;
        resp += `   * **Isu Penghalang**: ${p.currentIssueBlocker || 'Belum diperincikan'}\n`;
        resp += `   * **Tindakan Seterusnya**: ${p.nextAction || 'Penyelarasan agensi'}\n\n`;
      });
      resp += `Cadangan: Sila hubungi pegawai peneraju atau adakan sesi penyelarasan teknikal rentas agensi.`;
      return resp;
    }

    // Check if asking about agencies
    if (q.includes('senarai agensi') || q.includes('agensi terlibat') || q.includes('beban kerja agensi')) {
      const agencyStats = agencies.map(a => {
        const count = projects.filter(p => p.leadAgency === a.name).length;
        return { name: a.name, count, code: a.code };
      }).sort((a, b) => b.count - a.count);

      let resp = `### 🏛️ Taburan Inisiatif Mengikut Agensi Peneraju\n\n`;
      agencyStats.forEach(a => {
        resp += `* **${a.name}** (${a.code}): **${a.count} projek**\n`;
      });
      return resp;
    }

    return null;
  };

  const handleSendMessage = async (textToSend?: string) => {
    const question = (textToSend || inputText).trim();
    if (!question || isGenerating) return;

    setInputText('');

    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: question,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const assistantPlaceholderId = `asst-${Date.now()}`;
    const assistantPlaceholder: ChatMessage = {
      id: assistantPlaceholderId,
      sender: 'assistant',
      text: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isStreaming: true,
      statusText: 'Menghubungkan ke Gemini Enterprise Discovery Engine...'
    };

    setMessages(prev => [...prev, userMessage, assistantPlaceholder]);
    setIsGenerating(true);

    // First, check if there's a specific local repository answer that can enrich or satisfy the query
    const localInsight = tryAnswerFromLocalData(question);

    let cleanToken = accessToken.trim();
    if (!cleanToken && hasOAuthCredentials()) {
      try {
        cleanToken = await getEffectiveAccessToken();
        if (cleanToken) {
          setAccessToken(cleanToken);
          setTempToken(cleanToken);
        }
      } catch (tokenErr) {
        console.warn('Chatbot auto-token lookup notice:', tokenErr);
      }
    }

    try {
      // Call streamGeminiEnterpriseAgent (auto-refreshes internally if expired, or falls back seamlessly)
      const result = await streamGeminiEnterpriseAgent({
        accessToken: cleanToken,
        question: question,
        projects: projects,
        onProgress: (prog) => {
          setMessages(prev => prev.map(m => {
            if (m.id === assistantPlaceholderId) {
              return {
                ...m,
                text: prog.accumulatedText || '',
                statusText: prog.statusText,
                isStreaming: !prog.isFinished
              };
            }
            return m;
          }));
        }
      });

      // Update with final answer and inline chart if naturally comparative/numeric
      const chartData = extractChartDataFromResponse(result.answer, question, projects, agencies);

      setMessages(prev => prev.map(m => {
        if (m.id === assistantPlaceholderId) {
          return {
            ...m,
            text: result.answer,
            isStreaming: false,
            statusText: undefined,
            canCreateProject: true,
            chart: chartData || undefined
          };
        }
        return m;
      }));

      // Sync active token if refreshed
      const currentStored = localStorage.getItem('gemini_enterprise_token');
      if (currentStored && currentStored !== accessToken) {
        setAccessToken(currentStored);
        setTempToken(currentStored);
      }

      // Log chatbot submission to Firestore
      try {
        await logSubmission({
          type: 'CHATBOT_QUERY',
          details: {
            question,
            answerLength: result.answer.length,
            agentId: result.agentId
          }
        });
      } catch (logErr) {
        console.warn('Chatbot interaction log notice:', logErr);
      }

    } catch (err: any) {
      console.warn('Chatbot stream notice:', err);
      const errMsg = err.message || '';
      let displayError = "No response was generated. Try rephrasing your question.";

      if (
        /unauthenticated|permission_denied|invalid authentication|expired|credentials/i.test(errMsg)
      ) {
        displayError = "Pengesahan OAuth memerlukan semakan. Anda boleh memasukkan Bearer Token aktif melalui butang Token di atas.";
      } else if (errMsg) {
        displayError = errMsg;
      }

      let answerText = `⚠️ **${displayError}**\n\n`;

      // If we have local insights, supplement the response
      if (localInsight) {
        answerText += `### 💡 Maklumat Pangkalan Data Langsung (Firestore):\n\n${localInsight}`;
      }

      const fallbackChart = extractChartDataFromResponse(answerText, question, projects, agencies);

      setMessages(prev => prev.map(m => {
        if (m.id === assistantPlaceholderId) {
          return {
            ...m,
            text: answerText,
            isStreaming: false,
            error: true,
            statusText: undefined,
            chart: fallbackChart || undefined
          };
        }
        return m;
      }));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickPrompts = [
    { label: '📊 Status Projek Semasa', query: 'Bagaimanakah status kemajuan keseluruhan projek di Sabah?' },
    { label: '⚠️ Projek Tertunggak', query: 'Senaraikan projek yang lewat atau mempunyai isu penghalang.' },
    { label: '📈 Tren 30 Hari', query: 'Tunjukkan tren aktiviti dan kemasukan entri inisiatif dalam tempoh 30 hari.' },
    { label: '💡 Cadangan AI Inovasi', query: 'Cadangkan 3 inisiatif digital berasaskan AI untuk meningkatkan perkhidmatan awam Sabah.' },
    { label: '🏛️ Taburan Agensi', query: 'Senaraikan taburan projek mengikut agensi peneraju.' }
  ];

  return (
    <>
      {/* 1. FLOATING LAUNCHER BUTTON (Bottom-Right) */}
      {!isOpen && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce-short">
          <button
            type="button"
            id="btn-open-chatbot"
            onClick={handleToggle}
            className="group relative flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-full shadow-xl hover:shadow-emerald-600/40 border border-emerald-400/30 transition-all duration-200 cursor-pointer"
          >
            <div className="relative">
              <Bot className="w-5 h-5 text-white animate-pulse" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-300 rounded-full border-2 border-slate-900 animate-ping" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-900" />
            </div>
            <div className="text-left pr-1">
              <span className="block text-xs font-bold leading-tight">Chatbot AI KPSTI</span>
              <span className="block text-[10px] text-emerald-200 font-medium">Discovery Engine Online</span>
            </div>
          </button>
        </div>
      )}

      {/* 2. CHATBOT WINDOW / DRAWER */}
      {isOpen && (
        <div 
          id="chatbot-window"
          className={`fixed z-50 flex flex-col bg-slate-950 border border-slate-800 shadow-2xl rounded-2xl overflow-hidden transition-all duration-300 ${
            isExpanded 
              ? 'inset-4 sm:inset-10 md:inset-16' 
              : 'bottom-4 right-4 w-[95vw] sm:w-[440px] h-[600px] max-h-[85vh]'
          }`}
        >
          {/* Header */}
          <div className="bg-slate-900 text-white p-3.5 sm:p-4 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    Chatbot KPSTI Bayu AI
                  </h3>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/60 font-mono">
                    streamAssist
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 truncate max-w-[200px] sm:max-w-xs">
                  Ejen Gemini Enterprise • Discovery Engine
                </p>
              </div>
            </div>

            {/* Header Action Buttons */}
            <div className="flex items-center gap-1">
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Auto-Refresh
              </span>

              <button
                type="button"
                onClick={handleClearHistory}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg text-xs transition-colors cursor-pointer"
                title="Kosongkan Perbualan"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg text-xs transition-colors hidden sm:block cursor-pointer"
                title={isExpanded ? 'Kecilkan tetingkap' : 'Besarkan tetingkap'}
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                id="btn-close-chatbot"
                onClick={handleToggle}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg text-xs transition-colors cursor-pointer"
                title="Tutup Chatbot"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Chat Messages List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/50">
            {messages.map((msg, idx) => {
              const isUser = msg.sender === 'user';
              const prevUserQuery = !isUser && idx > 0 && messages[idx - 1]?.sender === 'user' ? messages[idx - 1].text : '';
              const inlineChart = msg.chart || (!isUser && !msg.isStreaming && msg.text ? extractChartDataFromResponse(msg.text, prevUserQuery, projects, agencies) : null);

              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 animate-fade-in ${
                    isUser ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                      isUser
                        ? 'bg-slate-700 text-slate-200'
                        : 'bg-emerald-600 text-white shadow-sm'
                    }`}
                  >
                    {isUser ? 'Anda' : <Bot className="w-3.5 h-3.5" />}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                      isUser
                        ? 'bg-emerald-600 text-white rounded-tr-xs'
                        : msg.error
                        ? 'bg-rose-950/50 text-rose-200 border border-rose-800/80 rounded-tl-xs'
                        : 'bg-slate-900 text-slate-100 border border-slate-800 rounded-tl-xs shadow-xs'
                    }`}
                  >
                    {/* Streaming status header if currently in progress */}
                    {msg.isStreaming && (
                      <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-slate-800 text-[11px] text-emerald-400 font-mono">
                        <div className="w-2.5 h-2.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                        <span>{msg.statusText || 'Sedang menstrim...'}</span>
                      </div>
                    )}

                    {/* Content */}
                    <div className="markdown-body prose prose-invert max-w-none text-xs sm:text-sm leading-relaxed overflow-x-auto">
                      <Markdown>{msg.text || (msg.isStreaming ? '...' : '')}</Markdown>
                      {msg.isStreaming && (
                        <span className="inline-block w-1.5 h-3.5 bg-emerald-400 animate-pulse ml-1 align-middle" />
                      )}
                    </div>

                    {/* Inline Chart & Mini-Report if applicable */}
                    {inlineChart && !msg.isStreaming && (
                      <ChatInlineChart chart={inlineChart} />
                    )}

                    {/* Footer Actions for Assistant Messages */}
                    {!isUser && !msg.isStreaming && (
                      <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2 text-[10px] text-slate-400">
                        <span className="font-mono text-[9px]">{msg.timestamp}</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleCopyMessage(msg.id, msg.text)}
                            className="hover:text-slate-200 flex items-center gap-1 transition-colors"
                            title="Salin teks"
                          >
                            {copiedMessageId === msg.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400">Disalin</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Salin</span>
                              </>
                            )}
                          </button>

                          {msg.canCreateProject && onOpenCreateProject && (
                            <button
                              type="button"
                              onClick={() => {
                                onOpenCreateProject({
                                  title: `Inisiatif Chatbot AI`,
                                  description: msg.text.slice(0, 400)
                                });
                              }}
                              className="hover:text-emerald-300 text-emerald-400 flex items-center gap-1 font-semibold transition-colors"
                              title="Daftar respons ini sebagai projek di Firestore"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Daftar Projek</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Carousel */}
          <div className="px-3 py-2 bg-slate-900 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            <span className="text-[10px] text-slate-400 shrink-0 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              Cadangan:
            </span>
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                type="button"
                disabled={isGenerating}
                onClick={() => handleSendMessage(qp.query)}
                className="px-2.5 py-1 rounded-full bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] whitespace-nowrap border border-slate-700/60 transition-colors disabled:opacity-50"
              >
                {qp.label}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <div className="p-3 bg-slate-900/90 border-t border-slate-800 shrink-0">
            <div className="relative flex items-center">
              <textarea
                ref={inputRef}
                rows={1}
                id="input-chatbot-message"
                placeholder={
                  isGenerating 
                    ? 'Ejen sedang memproses jawapan...' 
                    : 'Tanya soalan tentang projek atau inisiatif AI...'
                }
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isGenerating}
                className="w-full pl-3 pr-12 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none min-h-[42px] max-h-24 disabled:opacity-50"
              />
              <button
                type="button"
                id="btn-chatbot-send"
                disabled={!inputText.trim() || isGenerating}
                onClick={() => handleSendMessage()}
                className="absolute right-2 p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white disabled:text-slate-500 transition-colors cursor-pointer disabled:cursor-not-allowed"
                title="Hantar soalan"
              >
                {isGenerating ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
            <div className="flex items-center justify-between text-[9px] text-slate-500 mt-1.5 px-1">
              <span>Tekan <strong>Enter</strong> untuk hantar, <strong>Shift+Enter</strong> untuk baris baharu</span>
              <span>Kuasa Gemini Enterprise</span>
            </div>
          </div>

        </div>
      )}
    </>
  );
};
