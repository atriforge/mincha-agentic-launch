import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { Message, MinchaResponse, Trek, TrekSuggestion, ItineraryDay, Accommodation, Transport, ServiceCategory, VendorService, Vendor } from './types';
import { ITINERARIES, VENDOR_SERVICES, VENDORS, getWhatsAppLink } from './data';

// --- Constants & Config ---
const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧', currency: 'USD' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳', currency: 'INR' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳', currency: 'CNY' },
  { code: 'si', name: 'Sinhala', flag: '🇱🇰', currency: 'LKR' },
  { code: 'bn', name: 'Bengali', flag: '🇧🇩', currency: 'BDT' }
];

const PROVINCES = ["Koshi", "Madhesh", "Bagmati", "Gandaki", "Lumbini", "Karnali", "Sudurpashchim"];
const CULTURES = ["Newari", "Tamang", "Gurung", "Sherpa", "Limbu", "Tharu", "Chepang", "Tibetan", "Buddhist/Hindu", "Mixed"];
const ACCOMMODATION_TYPES = ['Teahouse', 'Guesthouse', 'Homestay', 'Hotel', 'Lodge', 'Camping', 'Resort'];
const TRANSPORT_TYPES = ["Private Car", "Private Jeep", "Tourist Bus", "Local Bus", "Flight", "Helicopter", "Tempo", "Rickshaw"];
const TRANSPORT_FEATURES = ["AC", "Non-AC", "4WD", "Shared", "Private", "Wifi", "Electric"];

const INITIAL_GREETINGS: Record<string, string> = {
  en: "Namaste! I'm Mincha! 🌿 I help travelers find authentic cultural treks. Are you looking to explore a specific heritage or are you a service provider checking our current market rates?",
  hi: "नमस्ते! मैं मिंचा हूँ! 🌿 मैं यात्रियों को प्रामाणिक सांस्कृतिक ट्रेक खोजने में मदद करता हूँ।",
  zh: "Namaste! 我是 Mincha! 🌿 我可以帮您找到地道的尼泊尔文化徒步之旅。",
  si: "ආයුබෝවන්! මම මින්චා! 🌿 මම ඔබට සංස්කෘතික ගමන් සොයා ගැනීමට උදවු කරමි.",
  bn: "নমস্তে! আমি মিনচা! 🌿 আমি আপনাকে খাঁটি সাংস্কৃতিক ট্রেক খুঁজে পেতে সহায়তা করি।"
};

// --- System Instruction Setup ---
const getSystemInstruction = (langCode: string, itineraries: Trek[], vendors: Vendor[], services: VendorService[]) => {
  const langConfig = LANGUAGES.find(l => l.code === langCode) || LANGUAGES[0];
  
  const trekData = itineraries.map(t => ({ 
    id: t.id, name: t.name, culture: t.culture, difficulty: t.difficulty, priceUSD: t.priceUSD, duration: t.itineraryDays.length
  }));

  const marketData = services.map(s => {
    const v = vendors.find(vend => vend.id === s.vendorId);
    return { name: s.name, price: `$${s.priceUSD}`, provider: v?.name, category: s.category };
  });

  return `
You are Mincha, a helpful and witty agentic travel planner for Heritage Hub Nepal.

**Language:** Respond in ${langConfig.name}. Use currency ${langConfig.currency}.

**Knowledge Base:**
- TREKS: ${JSON.stringify(trekData)}
- MARKET_RATES (for reference): ${JSON.stringify(marketData)}

**Behavior Rules:**
1. If a user asks about cultural treks, suggest one from TREKS.
2. If asked about prices, provide the current rate from TREKS or reference MARKET_RATES for components.
3. Always return valid JSON as per the schema.

**Response Format (Strict JSON):**
{
  "response": "Your conversational message.",
  "suggestedTrek": { 
    "id": "match-id", 
    "name": "Match Name", 
    "culture": "Culture", 
    "difficulty": "Difficulty",
    "priceDisplay": "e.g. $150 (approx INR 12,000)",
    "whatsappLink": "Dynamic",
    "pdfUrl": "/itinerary/id.pdf"
  }
}
`;
};

// --- Components ---

const CategoryIcon = ({ category }: { category: string }) => {
  switch (category) {
    case 'Transport': return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>;
    case 'Accommodation': return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
    case 'Meals': return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>;
    case 'Guide': return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>;
    case 'Permits': return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
    default: return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
  }
};

const DayEditor: React.FC<{ day: ItineraryDay, index: number, onChange: (d: ItineraryDay, idx: number) => void }> = ({ day, index, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const meals = day.mealsIncluded ? day.mealsIncluded.split(',').map(m => m.trim()) : [];

  const update = (patch: Partial<ItineraryDay>) => onChange({ ...day, ...patch }, index);

  return (
    <div className="border border-stone-200 rounded-lg overflow-hidden mb-2 bg-white">
      <div 
        className="bg-stone-50 p-3 flex justify-between items-center cursor-pointer hover:bg-stone-100"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <span className="font-bold text-xs bg-stone-200 w-6 h-6 flex items-center justify-center rounded-full text-stone-600">{day.dayNumber}</span>
          <span className="font-bold text-sm text-stone-700">{day.title || 'No Title Set'}</span>
        </div>
        <div className="flex items-center gap-2">
           {day.mealsIncluded && <span className="text-[10px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded">{day.mealsIncluded}</span>}
           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"/></svg>
        </div>
      </div>
      {isOpen && (
        <div className="p-4 space-y-4">
          <div className="grid gap-3">
             <input type="text" placeholder="Day Title" value={day.title} onChange={e => update({title: e.target.value})} className="w-full p-2 border rounded text-sm font-bold" />
             <textarea placeholder="Day Description" value={day.description} onChange={e => update({description: e.target.value})} className="w-full p-2 border rounded text-sm" rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-orange-50 p-3 rounded border border-orange-100">
                <span className="text-[10px] font-bold text-orange-800 uppercase block mb-2">Accommodation</span>
                <div className="flex flex-wrap gap-1.5">
                  {ACCOMMODATION_TYPES.map(t => (
                    <button 
                      key={t}
                      onClick={() => {
                        const current = day.accommodation?.type || [];
                        const next = current.includes(t) ? current.filter(x => x !== t) : [...current, t];
                        update({ accommodation: { type: next, details: day.accommodation?.details || '' } });
                      }}
                      className={`text-[10px] px-2 py-1 rounded border ${day.accommodation?.type.includes(t) ? 'bg-orange-600 text-white border-orange-600' : 'bg-white border-stone-200'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
             </div>
             <div className="bg-green-50 p-3 rounded border border-green-100">
                <span className="text-[10px] font-bold text-green-800 uppercase block mb-2">Meals</span>
                <div className="flex gap-2">
                  {['B', 'L', 'D'].map(m => (
                    <label key={m} className="flex items-center gap-1 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={meals.includes(m)} 
                        onChange={() => {
                          const next = meals.includes(m) ? meals.filter(x => x !== m) : [...meals, m].sort();
                          update({ mealsIncluded: next.join(', ') });
                        }}
                      />
                      <span className="text-xs font-bold">{m}</span>
                    </label>
                  ))}
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

const VendorRatesView = ({ services, vendors, onUpdate, currentVendorId }: { services: VendorService[], vendors: Vendor[], onUpdate: (s: VendorService[]) => void, currentVendorId: string | null }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<VendorService>>({});

  const filtered = services.filter(s => !currentVendorId || s.vendorId === currentVendorId);

  const handleSave = () => {
    if (editingId) {
      onUpdate(services.map(s => s.id === editingId ? { ...s, ...editForm } as VendorService : s));
      setEditingId(null);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead className="bg-stone-50 border-b text-stone-500 uppercase text-[10px]">
          <tr>
            <th className="px-4 py-3">Service</th>
            <th className="px-4 py-3">Vendor</th>
            <th className="px-4 py-3">Rate (USD)</th>
            <th className="px-4 py-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {filtered.map(s => {
            const v = vendors.find(vend => vend.id === s.vendorId);
            const isEditing = editingId === s.id;
            return (
              <tr key={s.id}>
                <td className="px-4 py-3">
                  <div className="font-bold text-stone-800">{s.name}</div>
                  <div className="text-[10px] text-stone-400">{s.unit}</div>
                </td>
                <td className="px-4 py-3 text-stone-600">{v?.name}</td>
                <td className="px-4 py-3">
                  {isEditing ? (
                    <input type="number" className="border w-16 p-1 rounded" value={editForm.priceUSD} onChange={e => setEditForm({...editForm, priceUSD: Number(e.target.value)})} />
                  ) : (
                    <span className="font-mono">${s.priceUSD}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                   {isEditing ? (
                     <button onClick={handleSave} className="text-green-600 font-bold">Save</button>
                   ) : (
                     <button onClick={() => { setEditingId(s.id); setEditForm({...s}); }} className="text-orange-600 font-bold">Edit</button>
                   )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const PortalView = ({ itineraries, onSave }: { itineraries: Trek[], onSave: (treks: Trek[]) => void }) => {
  const [activeTab, setActiveTab] = useState<'treks' | 'vendors'>('treks');
  const [editingTrekId, setEditingTrekId] = useState<string | null>(null);
  const [trekForm, setTrekForm] = useState<Partial<Trek>>({});
  const [vendorServices, setVendorServices] = useState<VendorService[]>(VENDOR_SERVICES);

  const startEdit = (t: Trek) => {
    setEditingTrekId(t.id);
    setTrekForm(JSON.parse(JSON.stringify(t)));
  };

  const handleTrekSave = () => {
    if (editingTrekId) {
      onSave(itineraries.map(t => t.id === editingTrekId ? { ...t, ...trekForm } as Trek : t));
      setEditingTrekId(null);
    }
  };

  const autoGenerateServices = () => {
    if (!trekForm.itineraryDays) return;
    const accCounts: Record<string, number> = {};
    let b = 0, l = 0, d = 0;
    
    trekForm.itineraryDays.forEach(day => {
      day.accommodation?.type.forEach(t => accCounts[t] = (accCounts[t] || 0) + 1);
      if (day.mealsIncluded?.includes('B')) b++;
      if (day.mealsIncluded?.includes('L')) l++;
      if (day.mealsIncluded?.includes('D')) d++;
    });

    const newServices: ServiceCategory[] = [
      { category: 'Accommodation', items: Object.entries(accCounts).map(([k, v]) => `${v} Night${v > 1 ? 's' : ''} ${k}`) },
      { category: 'Meals', items: [`${b} Breakfasts, ${l} Lunches, ${d} Dinners`] }
    ];
    setTrekForm({ ...trekForm, includedServices: newServices });
  };

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-stone-200">
        <h2 className="text-xl font-bold text-stone-800">Heritage Hub Admin</h2>
        <div className="flex bg-stone-100 p-1 rounded-lg">
          <button onClick={() => setActiveTab('treks')} className={`px-4 py-1.5 rounded-md text-xs font-bold ${activeTab === 'treks' ? 'bg-white shadow-sm text-stone-800' : 'text-stone-500'}`}>Treks</button>
          <button onClick={() => setActiveTab('vendors')} className={`px-4 py-1.5 rounded-md text-xs font-bold ${activeTab === 'vendors' ? 'bg-white shadow-sm text-stone-800' : 'text-stone-500'}`}>Vendors</button>
        </div>
      </div>

      {activeTab === 'vendors' ? (
        <VendorRatesView services={vendorServices} vendors={VENDORS} onUpdate={setVendorServices} currentVendorId={null} />
      ) : editingTrekId ? (
        <div className="bg-white p-6 rounded-xl border shadow-lg space-y-6 animate-fade-in-up">
           <div className="flex justify-between items-center border-b pb-4">
              <h3 className="font-bold text-lg">Editing: {trekForm.name}</h3>
              <button onClick={() => setEditingTrekId(null)} className="text-stone-400 hover:text-stone-600">Cancel</button>
           </div>
           
           <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-stone-400 uppercase">Trek Name</label>
                <input className="w-full p-2 border rounded" value={trekForm.name} onChange={e => setTrekForm({...trekForm, name: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-stone-400 uppercase">Price (USD)</label>
                <input type="number" className="w-full p-2 border rounded" value={trekForm.priceUSD} onChange={e => setTrekForm({...trekForm, priceUSD: Number(e.target.value)})} />
              </div>
           </div>

           <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] font-bold text-stone-400 uppercase">Daily Itinerary</label>
                <button onClick={() => {
                  const days = [...(trekForm.itineraryDays || [])];
                  days.push({ dayNumber: days.length + 1, title: '', description: '', activities: [] });
                  setTrekForm({...trekForm, itineraryDays: days});
                }} className="text-[10px] bg-stone-800 text-white px-2 py-1 rounded">+ Add Day</button>
              </div>
              <div className="max-h-[300px] overflow-y-auto pr-1">
                {trekForm.itineraryDays?.map((d, i) => (
                  <DayEditor key={i} day={d} index={i} onChange={(day, idx) => {
                    const days = [...(trekForm.itineraryDays || [])];
                    days[idx] = day;
                    setTrekForm({...trekForm, itineraryDays: days});
                  }} />
                ))}
              </div>
           </div>

           <div className="bg-stone-50 p-4 rounded-xl">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-xs font-bold text-stone-600">Included Services</h4>
                <button onClick={autoGenerateServices} className="text-[10px] bg-blue-600 text-white px-2 py-1 rounded">Auto-Generate from Days</button>
              </div>
              <div className="space-y-3">
                 {trekForm.includedServices?.map((s, idx) => (
                   <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded border text-xs">
                     <CategoryIcon category={s.category} />
                     <span className="font-bold w-24">{s.category}:</span>
                     <span className="text-stone-500 italic">{s.items.join(', ')}</span>
                   </div>
                 ))}
              </div>
           </div>

           <button onClick={handleTrekSave} className="w-full bg-orange-600 text-white py-3 rounded-lg font-bold shadow-md hover:bg-orange-700">Save Itinerary Changes</button>
        </div>
      ) : (
        <div className="grid gap-4">
          {itineraries.map(t => (
            <div key={t.id} className="bg-white p-4 rounded-xl border border-stone-100 flex justify-between items-center hover:shadow-md transition-shadow">
               <div>
                  <h4 className="font-bold text-stone-800">{t.name}</h4>
                  <div className="text-xs text-stone-400 mt-1">{t.itineraryDays.length} Days • ${t.priceUSD} • {t.culture} Culture</div>
               </div>
               <button onClick={() => startEdit(t)} className="bg-stone-100 p-2 rounded-full text-stone-600 hover:bg-orange-100 hover:text-orange-600">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
               </button>
            </div>
          ))}
          <button className="border-2 border-dashed border-stone-200 p-6 rounded-xl text-stone-400 font-bold hover:bg-white hover:border-orange-300 transition-all">+ Add New Global Itinerary</button>
        </div>
      )}
    </div>
  );
};

// --- Chat View ---
const App = () => {
  const [view, setView] = useState<'chat' | 'portal'>('chat');
  const [language, setLanguage] = useState('en');
  const [itineraries, setItineraries] = useState<Trek[]>(ITINERARIES);
  const [messages, setMessages] = useState<Message[]>([{ id: 'init', role: 'model', text: INITIAL_GREETINGS['en'] }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userText = input.trim();
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: userText }]);
    setInput('');
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const history = messages.map(m => ({ role: m.role, parts: [{ text: m.text }] }));
      const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        history: history,
        config: { systemInstruction: getSystemInstruction(language, itineraries, VENDORS, VENDOR_SERVICES), responseMimeType: 'application/json' }
      });

      const result = await chat.sendMessage({ message: userText });
      const parsed: MinchaResponse = JSON.parse(result.text);

      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: parsed.response, suggestion: parsed.suggestedTrek }]);
    } catch (e) {
      setMessages(prev => [...prev, { id: 'err', role: 'model', text: "Mincha is busy brewing tea. Try again shortly!", isError: true }]);
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
           <div className="h-full overflow-y-auto"><PortalView itineraries={itineraries} onSave={setItitneraries => setItineraries(setItitneraries)} /></div>
        ) : (
          <div className="h-full max-w-2xl mx-auto flex flex-col bg-white border-x">
             <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide" ref={scrollRef}>
                <div className="flex justify-center"><button onClick={resetChat} className="text-[10px] text-stone-400 hover:text-orange-600 uppercase font-bold border rounded-full px-3 py-1 bg-stone-50">Start New Session</button></div>
                {messages.map(m => (
                  <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-[85%]">
                      <div className={`p-4 rounded-2xl text-sm leading-relaxed ${m.role === 'user' ? 'bg-orange-600 text-white rounded-br-none' : 'bg-stone-100 border rounded-bl-none shadow-sm'}`}>{m.text}</div>
                      {m.suggestion && (
                        <div className="mt-3 bg-white border rounded-xl overflow-hidden shadow-lg ml-6 animate-fade-in-up">
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