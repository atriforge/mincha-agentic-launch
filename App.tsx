import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { Message, MinchaResponse, Trek, TrekSuggestion } from './types';
import { ITINERARIES, VENDOR_SERVICES, VENDORS, getWhatsAppLink } from './data';
import DayEditor from './DayEditor';
import { CategoryIcon } from './CategoryIcon';

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧', currency: 'USD' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳', currency: 'INR' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳', currency: 'CNY' },
  { code: 'si', name: 'Sinhala', flag: '🇱🇰', currency: 'LKR' },
  { code: 'bn', name: 'Bengali', flag: '🇧🇩', currency: 'BDT' }
];

const INITIAL_GREETINGS: Record<string, string> = {
  en: "Namaste! I'm Mincha! 🌿 I help travelers find authentic cultural treks. Are you looking to explore a specific heritage or are you a service provider checking our current market rates?",
  hi: "नमस्ते! मैं मिंचा हूँ! 🌿 मैं यात्रियों को प्रामाणिक सांस्कृतिक ट्रेक खोजने में मदद करता हूँ।",
  zh: "Namaste! 我是 Mincha! 🌿 我可以帮您找到地道的尼泊尔文化徒步之旅。",
  si: "ආයුබෝවන්! මම මින්චා! 🌿 මම ඔබට සංස්කෘතික ගමන් සොයා ගැනීමට උදවු කරමි.",
  bn: "নমস্তে! আমি মিনচা! 🌿 আমি আপনাকে খাঁটি সাংস্কৃতিক ট্রেক খুঁজে পেতে সহায়তা করি।"
};

const getSystemInstruction = (langCode: string, itineraries: Trek[]) => {
  const lang = LANGUAGES.find(l => l.code === langCode) || LANGUAGES[0];
  const trekData = itineraries.map(t => ({ id: t.id, name: t.name, culture: t.culture, difficulty: t.difficulty, priceUSD: t.priceUSD }));
  return `
You are Mincha, an AI agent for Heritage Hub Nepal. Respond ONLY in ${lang.name}.
Suggest treks from this list: ${JSON.stringify(trekData)}.
ALWAYS reply with VALID JSON in this format:
{
  "response": "Your reply in ${lang.name}.",
  "suggestedTrek": {
    "id": "string",
    "name": "string",
    "culture": "string",
    "difficulty": "string",
    "priceDisplay": "e.g. $95 (approx ₹7,980)",
    "whatsappLink": "https://wa.me/...",
    "pdfUrl": "/itinerary/id.pdf"
  }
}
NEVER add explanations, markdown, or extra text. ONLY JSON.
`;
};

const VendorRatesView = ({ services, vendors, onUpdate }: { services: any[], vendors: any[], onUpdate: any, currentVendorId: any }) => (
  <div>Vendor rates view (simplified for brevity)</div>
);

const PortalView = ({ itineraries, onSave }: { itineraries: Trek[], onSave: (treks: Trek[]) => void }) => (
  <div>Portal view (simplified – use your existing one)</div>
);

const App = () => {
  const [view, setView] = useState<'chat' | 'portal'>('chat');
  const [language, setLanguage] = useState('en');
  const [itineraries, setItineraries] = useState<Trek[]>(ITINERARIES);
  const [messages, setMessages] = useState<Message[]>([{ id: 'init', role: 'model', text: INITIAL_GREETINGS['en'] }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userText = input.trim();
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: userText }]);
    setInput('');
    setIsLoading(true);

    try {
     // Get Qwen API key from .env.local
const apiKey = import.meta.env.VITE_QWEN_API_KEY;
if (!apiKey) throw new Error("Missing VITE_QWEN_API_KEY");

const systemPrompt = getSystemInstruction(language, itineraries);
const chatHistory = [
  { role: "system", content: systemPrompt },
  ...messages.slice(1).map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text })),
  { role: 'user', content: userText }
];

const res = await fetch("https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${apiKey}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    model: "qwen-max", // or qwen-turbo, qwen-plus
    input: {
      messages: chatHistory
    },
    parameters: {
      result_format: "message",
      max_tokens: 1024,
      temperature: 0.7
    }
  })
});

      if (!res.ok) throw new Error("Qwen API error");
      const data = await res.json();
      const content = data.output.choices[0].message.content;

      // Extract JSON
      const jsonMatch = content.match(/```json\s*({.*?})\s*```/s);
      const cleanJson = jsonMatch ? jsonMatch[1] : content;
      const parsed: MinchaResponse = JSON.parse(cleanJson);

      // Generate links
      if (parsed.suggestedTrek) {
        parsed.suggestedTrek.whatsappLink = getWhatsAppLink(parsed.suggestedTrek.name);
        parsed.suggestedTrek.pdfUrl = `/itineraries/${parsed.suggestedTrek.id}.pdf`;
      }

      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: parsed.response, suggestion: parsed.suggestedTrek }]);
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { id: 'err', role: 'model', text: "Mincha is reflecting... Try again!", isError: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  const resetChat = () => setMessages([{ id: 'init', role: 'model', text: INITIAL_GREETINGS[language] || INITIAL_GREETINGS['en'] }]);

  return (
    <div className="h-screen flex flex-col font-sans bg-stone-50">
      <header className="bg-white border-b px-4 py-3 flex justify-between items-center shadow-sm z-30 sticky top-0">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('chat')}>
          <div className="w-8 h-8 bg-orange-600 rounded flex items-center justify-center text-white font-bold">M</div>
          <h1 className="font-bold text-sm tracking-tight text-stone-800">Heritage Hub <span className="text-orange-600">Nepal</span></h1>
        </div>
        <div className="flex items-center gap-2">
          <select value={language} onChange={e => setLanguage(e.target.value)} className="text-[10px] border rounded p-1.5 bg-stone-50 font-bold uppercase">
            {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.flag} {l.code}</option>)}
          </select>
          <button onClick={() => setView(view === 'chat' ? 'portal' : 'chat')} className={`p-2 rounded-lg ${view === 'portal' ? 'bg-orange-600 text-white' : 'bg-stone-100 text-stone-500'}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        {view === 'portal' ? (
          <div className="h-full overflow-y-auto"><PortalView itineraries={itineraries} onSave={setItineraries} /></div>
        ) : (
          <div className="h-full max-w-2xl mx-auto flex flex-col bg-white border-x">
            <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide" ref={scrollRef}>
              <div className="flex justify-center"><button onClick={resetChat} className="text-[10px] text-stone-400 hover:text-orange-600 uppercase font-bold border rounded-full px-3 py-1 bg-stone-50">Start New Session</button></div>
              {messages.map(m => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-[85%]">
                    <div className={`p-4 rounded-2xl text-sm leading-relaxed ${m.role === 'user' ? 'bg-orange-600 text-white rounded-br-none' : 'bg-stone-100 border rounded-bl-none shadow-sm'}`}>{m.text}</div>
                    {m.suggestion && (
                      <div className="mt-3 bg-white border rounded-xl overflow-hidden shadow-lg ml-6">
                        <div className="h-24 bg-stone-200 flex items-center justify-center text-stone-400 italic">Photo Placeholder</div>
                        <div className="p-4">
                          <h4 className="font-bold text-stone-900">{m.suggestion.name}</h4>
                          <p className="text-[10px] text-orange-600 font-bold uppercase">{m.suggestion.culture} Trek • {m.suggestion.difficulty}</p>
                          <div className="mt-3 flex items-center justify-between">
                            <span className="font-bold text-lg">{m.suggestion.priceDisplay}</span>
                            <a href={m.suggestion.whatsappLink} target="_blank" className="bg-[#25D366] text-white px-3 py-1.5 rounded-lg text-xs font-bold">WhatsApp</a>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && <div className="flex gap-1 items-center bg-stone-100 w-fit p-3 rounded-full ml-4"><div className="w-1 h-1 bg-stone-400 rounded-full animate-bounce"></div><div className="w-1 h-1 bg-stone-400 rounded-full animate-bounce delay-75"></div><div className="w-1 h-1 bg-stone-400 rounded-full animate-bounce delay-150"></div></div>}
            </div>
            <div className="p-4 border-t bg-stone-50">
              <div className="relative max-w-xl mx-auto">
                <input
                  autoFocus
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="Ask Mincha about cultural treks..."
                  className="w-full pl-5 pr-12 py-4 rounded-full border border-stone-300 focus:ring-2 focus:ring-orange-500 outline-none shadow-inner text-sm"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-orange-600 text-white rounded-full flex items-center justify-center disabled:opacity-50"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
