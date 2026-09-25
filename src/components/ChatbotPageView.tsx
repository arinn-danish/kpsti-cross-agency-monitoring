import React, { useState, useEffect, useRef } from 'react';
import Markdown from 'react-markdown';
import {
  Bot,
  Send,
  Sparkles,
  RotateCcw,
  Copy,
  Check,
  Plus,
  RefreshCw,
  Layers,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { Project, Agency, ChatInlineChartData } from '../types';
import {
  streamGeminiEnterpriseAgent,
  refreshOAuthAccessToken,
  getEffectiveAccessToken,
  hasOAuthCredentials
} from '../lib/geminiEnterprise';
import { logSubmission } from '../lib/firebase';
import { ChatInlineChart } from './ChatInlineChart';
import { extractChartDataFromResponse } from '../utils/chatChartExtractor';
import { ChatMessage } from './ChatbotWidget';

interface ChatbotPageViewProps {
  projects: Project[];
  agencies: Agency[];
  onOpenCreateProject?: (initialData?: Partial<Project>) => void;
  onNavigateToCore?: () => void;
  onNavigateToAnalytics?: () => void;
}

export const ChatbotPageView: React.FC<ChatbotPageViewProps> = ({
  projects,
  agencies,
  onOpenCreateProject,
  onNavigateToCore,
  onNavigateToAnalytics
}) => {
  const [inputText, setInputText] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

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
        id: 'msg-welcome-page',
        sender: 'assistant',
        text: `Salam sejahtera! Saya **Pembantu Pintar KPSTI (Gemini Enterprise Agent)**.

Saya boleh membantu anda untuk:
* 📊 **Menyemak status inisiatif & projek** merentasi agensi kerajaan Sabah.
* ⚠️ **Mengenal pasti isu penghalang & projek tertunggak**.
* 📈 **Menganalisis kemajuan, milestone, dan trend aktiviti**.
* 💡 **Merangka inisiatif strategik baharu** berasaskan kecerdasan buatan.
* 🏛️ **Menjelaskan maklumat perkhidmatan awam & digital Sabah**.

Sila ajukan sebarang pertanyaan berkaitan data inisiatif digital negeri Sabah atau pilih soalan pantas di bawah.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('kpsti_chatbot_history', JSON.stringify(messages));
    } catch (e) {
      console.warn('Could not save chatbot history to localStorage:', e);
    }
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2500);
  };

  const handleClearHistory = () => {
    localStorage.removeItem('kpsti_chatbot_history');
    setMessages([
      {
        id: `msg-reset-${Date.now()}`,
        sender: 'assistant',
        text: 'Sejarah perbualan telah dikosongkan. Sedia untuk pertanyaan baharu anda!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
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

    try {
      let cleanToken = '';
      try {
        cleanToken = await getEffectiveAccessToken();
      } catch (tokenErr) {
        console.warn('Auto-token retrieval notice:', tokenErr);
      }

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

      // Log query
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
        console.warn('Chatbot query log notice:', logErr);
      }

    } catch (err: any) {
      console.warn('Chatbot response notice:', err);
      const errMsg = err.message || 'Ralat semasa menjana respons.';
      setMessages(prev => prev.map(m => {
        if (m.id === assistantPlaceholderId) {
          return {
            ...m,
            text: `⚠️ **${errMsg}**\n\nSistem AI terus memproses pertanyaan anda menggunakan data repositori projek setempat Firestore.`,
            isStreaming: false,
            statusText: undefined
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
    { label: '⚠️ Projek Tertunggak & Blocker', query: 'Senaraikan projek yang lewat atau mempunyai isu penghalang.' },
    { label: '📈 Trend Aktiviti 30 Hari', query: 'Tunjukkan tren aktiviti dan kemasukan entri inisiatif dalam tempoh 30 hari.' },
    { label: '💡 Cadangan AI Inovasi Sabah', query: 'Cadangkan 3 inisiatif digital berasaskan AI untuk meningkatkan perkhidmatan awam Sabah.' },
    { label: '🏛️ Taburan Agensi Peneraju', query: 'Senaraikan taburan projek mengikut agensi peneraju.' }
  ];

  return (
    <div id="view-chatbot-page" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Page Header Card */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/20 shrink-0 ring-2 ring-emerald-400/30">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Chatbot AI KPSTI Bayu
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/60 font-mono">
                  Gemini Enterprise • streamAssist
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Ejen pintar perkhidmatan digital Sabah • Automatik segarkan sesi OAuth
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              OAuth Auto-Refresh Aktif
            </span>

            <button
              type="button"
              onClick={handleClearHistory}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer"
              title="Kosongkan Sejarah Sembang"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Question Chips */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex flex-wrap gap-2">
          {quickPrompts.map((qp, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(qp.query)}
              disabled={isGenerating}
              className="text-xs px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 hover:text-white text-slate-300 border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
            >
              {qp.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Conversation Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[650px] overflow-hidden">
        
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50">
          {messages.map((msg, idx) => {
            const isUser = msg.sender === 'user';
            const prevUserQuery = !isUser && idx > 0 && messages[idx - 1]?.sender === 'user' ? messages[idx - 1].text : '';
            const inlineChart = msg.chart || (!isUser && !msg.isStreaming && msg.text ? extractChartDataFromResponse(msg.text, prevUserQuery, projects, agencies) : null);

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 animate-fade-in ${
                  isUser ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                    isUser
                      ? 'bg-emerald-700 text-white'
                      : 'bg-slate-900 text-white shadow-xs'
                  }`}
                >
                  {isUser ? 'Anda' : <Bot className="w-4 h-4 text-emerald-400" />}
                </div>

                {/* Message Bubble */}
                <div className={`max-w-[85%] sm:max-w-[78%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                  
                  <div
                    className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      isUser
                        ? 'bg-emerald-600 text-white rounded-tr-xs shadow-xs'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-tl-xs shadow-xs'
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    ) : (
                      <>
                        {msg.statusText && msg.isStreaming && !msg.text && (
                          <div className="flex items-center gap-2 text-slate-500 py-1 font-medium animate-pulse text-xs">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                            <span>{msg.statusText}</span>
                          </div>
                        )}

                        <div className="markdown-chat prose prose-sm max-w-none text-slate-800 prose-headings:text-slate-900 prose-headings:font-bold prose-a:text-emerald-600 prose-code:bg-slate-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs">
                          <Markdown>{msg.text}</Markdown>
                        </div>

                        {msg.isStreaming && msg.text && (
                          <span className="inline-block w-2 h-4 ml-1 bg-emerald-600 animate-pulse" />
                        )}

                        {/* Inline Data Visualizer Chart */}
                        {inlineChart && (
                          <div className="mt-3.5 pt-3.5 border-t border-slate-100">
                            <ChatInlineChart chart={inlineChart} />
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Message Meta & Action Footer */}
                  <div className="flex items-center gap-2 mt-1.5 px-1 text-[11px] text-slate-400">
                    <span>{msg.timestamp}</span>

                    {!isUser && !msg.isStreaming && msg.text && (
                      <>
                        <span>•</span>
                        <button
                          type="button"
                          onClick={() => handleCopyText(msg.text, msg.id)}
                          className="hover:text-slate-600 flex items-center gap-1 cursor-pointer"
                          title="Salin jawapan"
                        >
                          {copiedMessageId === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-600 font-semibold">Disalin</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Salin</span>
                            </>
                          )}
                        </button>

                        {msg.canCreateProject && onOpenCreateProject && (
                          <>
                            <span>•</span>
                            <button
                              type="button"
                              onClick={() => {
                                onOpenCreateProject({
                                  title: 'Inisiatif berasaskan cadangan AI KPSTI',
                                  description: msg.text.slice(0, 200)
                                });
                              }}
                              className="text-emerald-700 hover:text-emerald-800 font-medium flex items-center gap-1 cursor-pointer"
                              title="Gunakan cadangan ini untuk mendaftar projek"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Daftar Projek Ini</span>
                            </button>
                          </>
                        )}
                      </>
                    )}
                  </div>

                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3.5 sm:p-4 bg-white border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-end gap-2.5"
          >
            <div className="flex-1 relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Tanya apa-apa soalan mengenai inisiatif digital, status projek, atau cadangan AI KPSTI... (Tekan Enter untuk hantar)"
                rows={2}
                disabled={isGenerating}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={!inputText.trim() || isGenerating}
              className="px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
            >
              {isGenerating ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">{isGenerating ? 'Menjana...' : 'Hantar'}</span>
            </button>
          </form>

          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Dikuasakan oleh Gemini Enterprise Discovery Engine • Data masa nyata Cloud Firestore</span>
            <span className="text-[10px]">Tekan Shift + Enter untuk baris baharu</span>
          </div>
        </div>

      </div>

    </div>
  );
};
