import React, { useState, useEffect, useRef } from 'react';
import { generateAdvice } from '../../services/aiAdvisorService';
import { X, ShieldAlert, ShieldCheck, Shield, Send, Wand2, Sword, Scroll, ShieldHalf } from 'lucide-react';

const StatusShield = ({ status }) => {
  if (status === 'RED') return <ShieldAlert className="w-5 h-5 text-rose-600" />;
  if (status === 'YELLOW') return <ShieldAlert className="w-5 h-5 text-amber-500" />;
  return <ShieldCheck className="w-5 h-5 text-emerald-600" />;
};

// Simple Markdown parser for basic formatting (bold, newlines, lists)
const parseMarkdown = (text) => {
  if (!text) return null;
  const blocks = text.split('\n\n');
  
  return blocks.map((block, i) => {
    // Handle lists
    if (block.trim().startsWith('- ') || block.trim().startsWith('* ')) {
      const items = block.split('\n').filter(line => line.trim().startsWith('- ') || line.trim().startsWith('* '));
      return (
        <ul key={i} className="list-disc pl-5 my-2 space-y-1">
          {items.map((item, j) => {
            const content = item.replace(/^[-*]\s/, '');
            return <li key={j} dangerouslySetInnerHTML={{ __html: content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
          })}
        </ul>
      );
    }
    
    // Regular paragraphs with bold support
    const formattedHtml = block.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>');
    return <p key={i} className="my-2" dangerouslySetInnerHTML={{ __html: formattedHtml }} />;
  });
};

export const RoyalAdvisorModal = ({ isOpen, onClose, contextPacket }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (isOpen && contextPacket && messages.length === 0) {
      // Initial greeting
      setMessages([{
        role: 'model',
        content: "Greetings, my Lord. I have reviewed the Royal Ledgers. How may I counsel your financial strategies today?"
      }]);
    }
  }, [isOpen, contextPacket]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  if (!isOpen) return null;

  const handleSend = async (textOverride = null) => {
    const textToSend = textOverride || inputValue.trim();
    if (!textToSend || isTyping) return;

    const newMessages = [...messages, { role: 'user', content: textToSend }];
    setMessages(newMessages);
    setInputValue('');
    setIsTyping(true);

    try {
      const history = newMessages.slice(1); // Exclude the initial local greeting from history to avoid confusion
      const advice = await generateAdvice(contextPacket, textToSend, history);
      setMessages([...newMessages, { role: 'model', content: advice }]);
    } catch (error) {
      setMessages([...newMessages, { role: 'model', content: "Alas, an error has occurred communicating with the arcane realms: " + error.message }]);
    } finally {
      setIsTyping(false);
    }
  };

  const getOverallStatus = () => {
    if (!contextPacket) return 'UNKNOWN';
    const flags = contextPacket.deterministic_flags || [];
    if (flags.some(f => f.status === 'RED')) return 'RED';
    if (flags.some(f => f.status === 'YELLOW')) return 'YELLOW';
    return 'GREEN';
  };

  const overallStatus = getOverallStatus();
  
  const quickChips = [
    { label: "Debt Avalanche Strategy", icon: <Sword className="w-3 h-3" />, prompt: "What is the best strategy to eliminate my current debts based on the ledgers?" },
    { label: "Emergency Reserve Plan", icon: <ShieldHalf className="w-3 h-3" />, prompt: "How long is my current survival runway, and how can I extend it?" },
    { label: "Budget Leak Analysis", icon: <Scroll className="w-3 h-3" />, prompt: "Are there any budget categories where I am severely overspending?" },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 md:p-6" onClick={onClose}>
      <div 
        className="w-full max-w-2xl bg-[#faf4e5] border-4 border-[#8b4513] rounded-xl shadow-2xl flex flex-col max-h-full font-serif overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#8b4513]/30 bg-[#f5e6ce]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-stone-800 rounded-full flex items-center justify-center border-2 border-[#8b4513] shadow-inner">
              <Wand2 className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900 leading-none">The Royal Advisor</h2>
              <div className="flex items-center gap-1 mt-1">
                <StatusShield status={overallStatus} />
                <span className="text-[10px] font-bold text-stone-600 uppercase tracking-wider">
                  Kingdom Status: {overallStatus}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-[#8b4513]/10 rounded text-stone-600 hover:text-stone-900 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Chat Area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50/50 scrollbar-thin scrollbar-thumb-amber-800/40"
        >
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-lg p-3 shadow-sm ${msg.role === 'user' ? 'bg-[#8b4513] text-[#faf4e5] rounded-tr-none' : 'bg-white border border-[#8b4513]/20 text-stone-800 rounded-tl-none'}`}>
                {msg.role === 'user' ? (
                  <p className="text-sm">{msg.content}</p>
                ) : (
                  <div className="text-sm leading-relaxed prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 text-stone-800">
                    {parseMarkdown(msg.content)}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white border border-[#8b4513]/20 rounded-lg rounded-tl-none p-3 shadow-sm flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-600 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-amber-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-amber-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          )}
        </div>

        {/* Action Chips */}
        <div className="px-4 py-2 bg-[#f5e6ce] border-t border-[#8b4513]/20 flex gap-2 overflow-x-auto scrollbar-none">
          {quickChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(chip.prompt)}
              disabled={isTyping}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#8b4513]/30 rounded-full text-xs font-semibold text-stone-700 hover:bg-[#8b4513] hover:text-[#faf4e5] transition-colors whitespace-nowrap disabled:opacity-50"
            >
              {chip.icon}
              {chip.label}
            </button>
          ))}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-[#f5e6ce]">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex items-end gap-2 bg-white rounded-lg border border-[#8b4513]/30 focus-within:border-[#8b4513] focus-within:ring-1 focus-within:ring-[#8b4513] p-1 transition-all"
          >
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask for counsel, my Lord..."
              className="flex-1 max-h-32 min-h-[44px] bg-transparent border-none focus:ring-0 resize-none text-sm p-2 text-stone-800 placeholder-stone-400 font-sans"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isTyping}
              className="p-2.5 bg-[#8b4513] text-[#faf4e5] rounded-md hover:bg-[#6b350e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-0.5 mr-0.5"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
