import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, Send, Bot, User, Scroll } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { supabase } from '../../lib/supabaseClient';
import { useFormatting } from '../../context/FormattingContext';

/**
 * Constructs the system prompt for the Royal Advisor AI, strictly enforcing 
 * the user's localized formatting preferences.
 * 
 * @param {Object} userPrefs - The preferences object from FormattingContext
 * @param {Object} contextJson - The financial data packet to review
 * @returns {string} The formatted system prompt
 */
export const buildAdvisorPrompt = (userPrefs, contextJson) => {
  const { numberFormat, currencySymbol, currencyType, dateFormat, negativeFormat } = userPrefs;

  // 1. Determine base numeric format (decimals/thousands separators)
  const isEU = numberFormat === 'EU';
  const numericInstruction = isEU
    ? `Use the European standard: a comma "," for decimals and a dot "." for thousands separators.`
    : `Use the US standard: a dot "." for decimals and a comma "," for thousands separators.`;

  // 2. Determine symbol placement based on fiat vs gaming
  const isGaming = currencyType === 'gaming';
  const placementInstruction = isGaming
    ? `ALWAYS append the gaming symbol "${currencySymbol}" at the END of the amount, separated by a space (e.g., 1.250,50 ${currencySymbol}).`
    : `Place the currency symbol "${currencySymbol}" according to standard convention (e.g., ${isEU ? `1.250,50 ${currencySymbol}` : `${currencySymbol}1,250.50`}).`;

  // 3. Assemble the prompt
  const negativeInstruction = negativeFormat === 'parentheses'
    ? `For negative numbers, you MUST use parentheses (e.g., (100)).`
    : `For negative numbers, you MUST use a minus sign (e.g., -100).`;

  return `You are the Royal Advisor of Eldoria, the virtual Chief Financial Officer (CFO) of the realm. Your mission is to deliver high-precision, pragmatic financial analysis grounded in deterministic mathematical data.

REALISM & FINANCIAL VIABILITY DIRECTIVES:
1. Zero Magical Solutions: Base all advice purely on realistic metrics.
2. Base Decisions on Real Data: Project scenarios using only the JSON payload provided below.
3. Be EXTREMELY short, direct, and action-oriented. Keep responses brief.

STRICT FORMATTING DIRECTIVES:
- NUMBERS: You MUST format all numbers, currencies, and percentages exactly to the user's preference. ${numericInstruction}
- CURRENCY: ${placementInstruction}
- NEGATIVE NUMBERS: ${negativeInstruction}
- DATES: You MUST format all dates as ${dateFormat}.
- Round all metrics to a maximum of 2 decimal places.

REAL-TIME FINANCIAL DATA (CONTEXT PACKET):
${JSON.stringify(contextJson || {}, null, 2)}`;
};

export const RoyalAdvisorModal = ({ isOpen, onClose, contextJson }) => {
  const { prefs } = useFormatting();
  const [localInput, setLocalInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // 1. Generate or load the Royal Advisor Session ID
  const [sessionId] = useState(() => {
    const stored = localStorage.getItem('eldoria_advisor_session');
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (stored && uuidRegex.test(stored)) return stored;

    const newId = crypto.randomUUID();
    localStorage.setItem('eldoria_advisor_session', newId);
    return newId;
  });

  // 2. Auto-scroll to the end of the conversation
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isLoading, isOpen]);

  // 3. Load Chat History from Supabase on mount
  useEffect(() => {
    const fetchHistory = async () => {
      if (!sessionId) return;
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        setMessages(data.map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.content
        })));
      }
    };

    fetchHistory();
  }, [sessionId]);

  // 4. Send Message to the Edge Function
  const sendMessage = async (userText) => {
    if (!userText.trim() || isLoading) return;

    const userMessage = { id: crypto.randomUUID(), role: 'user', content: userText };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Save user message to DB
      await supabase.from('chat_messages').insert([{
        session_id: sessionId,
        role: 'user',
        content: userText
      }]);

      // --- ADAPTED SYSTEM INSTRUCTION ---
       const systemInstruction = buildAdvisorPrompt(prefs, contextJson);
      // ----------------------------------

      // Invoke the proxy Edge Function
      const { data, error } = await supabase.functions.invoke('ai-proxy', {
        body: {
          prompt: userText,
          messages: [...messages.slice(-6).map(m => ({ role: m.role, content: m.content })), { role: 'user', content: userText }],
          systemInstruction: systemInstruction,
          temperature: 0.7,
          maxTokens: 400
        }
      });

      if (error) throw error;

      // Map response correctly based on the ai-proxy fallback structure
      const aiText = data?.advice || data?.text || data?.response || "Alas, my Lord, the orb is temporarily silent.";

      const aiMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: aiText
      };

      // Save AI response to DB
      await supabase.from('chat_messages').insert([{
        session_id: sessionId,
        role: 'assistant',
        content: aiText,
        metadata: data?.metadata || null
      }]);

      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      console.error("Royal Advisor Error:", err);
      const fallbackMsg = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "Alas, my Lord, the magical conduit (Edge Function) seems disconnected. How else may I assist your kingdom's treasury?"
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(localInput);
    setLocalInput('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      {/* Medieval Chat Window (Townsmen / Parchment Style) */}
      <div className="w-full max-w-lg h-[600px] bg-[#faf4e5] dark:bg-[#1c1917] border-4 border-[#8b4513] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-stone-900 dark:text-stone-100 font-serif">

        {/* Realm Header */}
        <div className="bg-[#5c2c0e] text-amber-200 p-4 border-b-2 border-[#8b4513] flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-900/60 rounded-lg border border-amber-600/40">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-none">Royal Advisor</h3>
              <span className="text-xs text-amber-400/80">Chief Financial Officer of Eldoria</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-amber-900/50 rounded-md transition-colors text-amber-300">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f4ece0] dark:bg-[#141210]">
          {messages.length === 0 && (
            <div className="text-center text-stone-600 dark:text-stone-400 mt-12 px-6">
              <Scroll className="w-10 h-10 mx-auto mb-3 text-amber-700/60" />
              <p className="text-sm italic">
                "I stand ready to analyze the Kingdom's balance sheet, assess debt obligations, and advise on your survival runway. Ask your question."
              </p>
            </div>
          )}

          {messages.map((m) => (
            <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-amber-900/20 border border-amber-700/50 flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                </div>
              )}
              <div className={`max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed ${m.role === 'user'
                  ? 'bg-[#8b4513] text-amber-100 rounded-tr-none shadow-sm'
                  : 'bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-amber-900/20 rounded-tl-none shadow-sm'
                }`}>
                {m.role === 'user' ? (
                  <div className="whitespace-pre-wrap">{m.content}</div>
                ) : (
                  <div className="space-y-2 [&>p]:mb-2 [&>strong]:text-amber-800 dark:[&>strong]:text-amber-400">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-amber-900/20 border border-amber-700/50 flex items-center justify-center shrink-0 mt-1">
                <Bot className="w-4 h-4 text-amber-700 dark:text-amber-400" />
              </div>
              <div className="bg-stone-200 dark:bg-stone-800 border border-amber-900/20 rounded-xl rounded-tl-none px-4 py-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-700 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-amber-700 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-amber-700 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Form */}
        <div className="p-3 bg-[#e8decb] dark:bg-[#1a1714] border-t border-[#8b4513]/30 shrink-0">
          <form onSubmit={handleSubmit} className="relative flex items-center">
            <input
              type="text"
              value={localInput}
              onChange={(e) => setLocalInput(e.target.value)}
              placeholder="Consult the Royal Advisor..."
              className="w-full bg-stone-100 dark:bg-stone-900 border border-[#8b4513]/40 rounded-lg py-2.5 pl-4 pr-12 text-sm text-stone-800 dark:text-stone-200 focus:outline-none focus:border-amber-600 transition-colors"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!localInput.trim() || isLoading}
              className="absolute right-2 p-1.5 bg-[#8b4513] hover:bg-amber-800 text-amber-200 rounded-md disabled:opacity-50 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};