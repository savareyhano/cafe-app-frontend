import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { ChatMessage, Language } from '../types';
import { TRANSLATIONS } from '../data';
import { motion, AnimatePresence } from 'motion/react';

const SUGGESTED_PROMPTS = {
  en: [
    { label: "🍵 Signature Beverages", prompt: "What are your signature drinks at Mirasa?" },
    { label: "🪵 Creative Workspaces", prompt: "Can you tell me about the cozy spaces to work or think?" },
    { label: "🧘 Wellness & Meditative Activities", prompt: "I feel stressed. What mindfulness sessions do you offer?" },
    { label: "🌱 Join the Circle", prompt: "How do I become a community member at Mirasa?" },
  ],
  id: [
    { label: "🍵 Menu Seduhan Khusus", prompt: "Apa saja kopi dan minuman khas di Mirasa?" },
    { label: "🪵 Ruang Kerja Tenang", prompt: "Bisa beritahu saya tempat yang sunyi untuk bekerja atau berpikir?" },
    { label: "🧘 Kegiatan Meditasi & Raga", prompt: "Saya sedang penat. Pengalaman mindfulness apa yang disarankan?" },
    { label: "🌱 Bergabung Komunitas", prompt: "Bagaimana cara mendaftar anggota ekosistem Mirasa?" },
  ]
};

export default function ChatBot({ language }: { language: Language }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(1); // Set to 1 initially to nudge users
  
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Load intro message once
  useEffect(() => {
    setMessages([
      {
        sender: 'bot',
        text: TRANSLATIONS[language].chatIntro,
        timestamp: new Date()
      }
    ]);
  }, [language]);

  // Handle auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setUnreadCount(0);
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim() || isLoading) return;

    if (!customText) {
      setInputMessage('');
    }

    // Append user message
    const userMsg: ChatMessage = {
      sender: 'user',
      text: textToSend,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          language: language
        })
      });

      if (!response.ok) {
        throw new Error('Could not contact Mira server');
      }

      const data = await response.json();
      
      const botMsg: ChatMessage = {
        sender: 'bot',
        text: data.response || "Mira is enjoying the silence, ask me again when the breeze returns.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error("[Chat Error]:", error);
      const errorMsg: ChatMessage = {
        sender: 'bot',
        text: language === 'en' 
          ? "I apologize, seeker. My thoughts are clouded by the high mountain mist at this moment. Let us sit quietly for a second and try again."
          : "Mohon maaf, penjelajah. Pikiran saya sedang terhalang oleh kabut tebal sore ini. Mari kita hening sejenak lalu coba kembali.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          id="btn-chatbot-toggle"
          onClick={() => {
            setIsOpen(!isOpen);
            setUnreadCount(0);
          }}
          className="relative group bg-wood hover:bg-wood-dark text-beige p-4 rounded-full shadow-2xl transition-all duration-300 scale-100 active:scale-95 cursor-pointer flex items-center justify-center border border-beige/10 hover:border-beige/30"
          aria-label="Toggle chatbot companion"
        >
          {isOpen ? <X size={22} className="rotate-90 transition-transform duration-300" /> : <MessageSquare size={22} />}
          
          {unreadCount > 0 && !isOpen && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-beige opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-beige text-forest text-[9px] font-bold items-center justify-center">
                {unreadCount}
              </span>
            </span>
          )}
          
          <span className="absolute right-14 bg-forest-dark/95 text-beige border border-beige/10 text-xs px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 mr-2 pointer-events-none font-sans font-normal tracking-wide shadow-lg">
            {language === 'en' ? 'Speak with Mira' : 'Tanya Mira'}
          </span>
        </button>
      </div>

      {/* Chat Windows (AnimatePresence) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="chat-window-panel"
            initial={{ opacity: 0, y: 35, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 35, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-24 right-6 w-[92%] sm:w-[420px] h-[520px] max-h-[75vh] z-50 rounded-2xl glass-panel shadow-2xl flex flex-col overflow-hidden border border-beige/10 font-sans"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-beige/10 flex items-center justify-between bg-forest-dark/70">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-wood flex items-center justify-center text-beige">
                  <Sparkles size={16} className="animate-pulse" />
                </div>
                <div>
                  <h4 className="text-sm font-sans font-semibold tracking-wider text-beige">
                    {TRANSLATIONS[language].chatHeading}
                  </h4>
                  <p className="text-[10px] font-mono text-beige/50 uppercase tracking-widest flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block animate-ping"></span>
                    {language === 'en' ? 'Sanctuary Guardian' : 'Penjaga Ruang'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="text-beige/60 hover:text-beige hover:bg-beige/10 p-1 rounded-full transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-forest-dark/20 custom-scrollbar">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-wood text-beige rounded-br-none font-medium'
                      : 'bg-forest/60 text-beige/95 rounded-bl-none border border-beige/10 backdrop-blur-sm'
                  }`}>
                    {msg.text.split('\n').map((line, lidx) => (
                      <p key={lidx} className={lidx > 0 ? "mt-1.5" : ""}>
                        {line}
                      </p>
                    ))}
                    <div className="text-[9px] font-mono opacity-50 text-right mt-1.5">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-forest/30 border border-beige/10 rounded-2xl p-4 flex items-center gap-2 max-w-[80%] rounded-bl-none">
                    <RefreshCw size={14} className="animate-spin text-wood" />
                    <span className="text-xs font-mono text-beige/70 italic">
                      {language === 'en' ? 'Mira gathers thoughts...' : 'Mira mencari keteduhan...'}
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggestion Chips */}
            <div className="px-3 py-2 border-t border-beige/5 bg-forest-dark/40 flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-none py-1.5">
              {SUGGESTED_PROMPTS[language].map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(chip.prompt)}
                  disabled={isLoading}
                  className="bg-forest-light/60 hover:bg-forest text-[11px] text-beige/90 px-3 py-1.5 rounded-full border border-beige/10 hover:border-wood transition-all cursor-pointer active:scale-95 disabled:pointer-events-none disabled:opacity-50"
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="px-4 py-3 border-t border-beige/10 bg-forest-dark/80 flex items-center gap-2"
            >
              <input
                type="text"
                placeholder={TRANSLATIONS[language].chatPlaceholder}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                disabled={isLoading}
                className="flex-1 bg-forest/40 border border-beige/10 focus:border-wood text-beige text-xs placeholder-beige/40 px-3 py-2.5 rounded-xl outline-none focus:ring-1 focus:ring-wood transition-all disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="bg-wood hover:bg-wood-dark disabled:bg-forest/40 disabled:text-beige/40 text-beige p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center border border-beige/5 hover:border-beige/20"
              >
                <Send size={15} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
