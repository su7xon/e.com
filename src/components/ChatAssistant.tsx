import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, Send, Trash2, Loader2, Plus } from 'lucide-react';
import { chatWithGroq, GroqChatMessage } from '../lib/groq';
import { needsCustomize } from '../lib/customize';
import type { Coupon, MenuItem } from '../types';

interface ChatAssistantProps {
  menuItems: MenuItem[];
  coupons: Coupon[];
  hasCart?: boolean;
  onAddToCart: (item: MenuItem) => void;
  onOpenCart: () => void;
  onOpenCustomize?: (item: MenuItem) => void;
  onSelectCategory?: (key: string) => void;
}

interface UiMsg {
  role: 'user' | 'assistant';
  content: string;
  addId?: string | null;
}

const AVATAR = '/images/chatbot-avatar.jpeg';
const STORE_KEY = 'seven_cheese_chat_v1';
const ADD_TAG = /\[ADD:([a-zA-Z0-9_-]+)\]\s*$/;

function stripAddTag(text: string): { clean: string; addId: string | null } {
  const m = text.match(ADD_TAG);
  if (!m) return { clean: text, addId: null };
  return { clean: text.replace(ADD_TAG, '').trim(), addId: m[1] };
}

// Language mirror: pure English in → English out, Hinglish in → Hinglish out.
type ChatLang = 'en' | 'hinglish';
const HINDI_RE = /[ऀ-ॿ]/;
const HING_WORDS = /^(hai|ho|hun|hu|ka|ki|ke|ko|me|mein|main|tum|aap|kya|kaise|kaisa|kaisi|chahiye|karo|kro|batao|bataiye|bata|dikhao|dekho|wala|wali|wale|kitna|kitne|kitni|mujhe|mere|mera|meri|tera|teri|apka|aapka|aur|bhi|nahi|nhi|acha|accha|sahi|theek|zara|thoda|bahut|bahot|kuch|sab|yeh|ye|woh|vo|raha|rahi|rahe|rha|rhi|gaya|gayi|liye|saath|paas|waha|yaha|kab|kaha|kahan|kaun|kyu|kyun|mat|na|toh|karna|lena|dena|hoga|hogi|hona|wala|sakte|sakta|sakti|chahte|lagta|milta|milga|milega|khana|khane|pina|peena|daam|kimat|sasta|mehenga|acche|achhe|badhiya|mast|jaldi|dheere|abhi|kal|aaj|par|per|se|tak|tak|mein|ne|ko|ka)$/;

function detectLang(text: string): ChatLang {
  if (HINDI_RE.test(text)) return 'hinglish';
  const words = text.toLowerCase().split(/[^a-z]+/).filter(Boolean);
  if (!words.length) return 'hinglish';
  const hits = words.filter((w) => HING_WORDS.test(w)).length;
  if (hits >= 2) return 'hinglish';
  if (hits === 1 && words.length <= 5) return 'hinglish';
  return 'en';
}

const LANG_DIRECTIVE: Record<ChatLang, string> = {
  en: 'LANGUAGE RULE: The user is speaking pure English. Reply in plain English ONLY. No Hindi/Hinglish words at all.',
  hinglish:
    'LANGUAGE RULE: The user is speaking Hinglish (Hindi + English mix). Reply in Hinglish using Roman script only (e.g. "bilkul, ye raha best option..."). No Devanagari script.',
};

// Offline fallback — keyword match so bot never looks dead without network/key.
function offlineReply(q: string, menu: MenuItem[], coupons: Coupon[], lang: ChatLang): { text: string; addId: string | null } {
  const s = q.toLowerCase();
  const en = lang === 'en';
  if (/track|order.*status|where.*order/.test(s))
    return {
      text: en
        ? 'To track your order, open the Reorder tab in the bottom bar and tap Track Order. You will see live ETA and rider details there. Anything else I can help with?'
        : 'Apne order ka status dekhne ke liye bottom bar me Reorder tab kholo, phir Track Order dabao. Live ETA aur rider details wahi milenge. Kuch aur help chahiye?',
      addId: null,
    };
  if (/deal|offer|coupon|discount|promo/.test(s)) {
    const list = coupons.slice(0, 4).map((c) => `• ${c.code} — ${c.description}`).join('\n');
    return {
      text: en
        ? `Today's best offers:\n${list}\n\nApply the coupon code in your cart, discount will apply automatically.`
        : `Aaj ke best offers:\n${list}\n\nCart me coupon code lagao, discount auto apply ho jayega.`,
      addId: null,
    };
  }
  if (/7\s?cheese|signature|special/.test(s)) {
    const f = menu.find((m) => m.id === 'p-7cheese-signature');
    return {
      text: en
        ? `House special: Original 7 Cheese Pizza — Mozzarella, Cheddar, Gouda, Parmesan, Provolone, Fontina and Ricotta, only ₹${f?.price ?? 329}. Customize and order it, highly recommended!`
        : `House special: Original 7 Cheese Pizza — Mozzarella, Cheddar, Gouda, Parmesan, Provolone, Fontina aur Ricotta, sirf ₹${f?.price ?? 329}. Customize karke order karo, highly recommended!`,
      addId: f ? f.id : null,
    };
  }
  const words = s.split(/[^a-z0-9]+/).filter((w) => w.length > 2);
  const hit = menu.find((m) => {
    const hay = `${m.name} ${m.description} ${(m.toppings || []).join(' ')} ${m.category}`.toLowerCase();
    return words.some((w) => hay.includes(w));
  });
  if (hit)
    return {
      text: en
        ? `${hit.name} — ₹${hit.price} (${hit.isVeg ? 'Veg' : 'Non-veg'}). ${hit.description.slice(0, 140)}`
        : `${hit.name} — ₹${hit.price} (${hit.isVeg ? 'Veg' : 'Non-veg'}). ${hit.description.slice(0, 140)}`,
      addId: hit.id,
    };
  if (/veg/.test(s)) {
    const veg = menu.filter((m) => m.isVeg).slice(0, 3);
    return {
      text: en
        ? `Top veg picks:\n${veg.map((m) => `• ${m.name} — ₹${m.price}`).join('\n')}\n\nTell me any name and I will help you add it.`
        : `Top veg picks:\n${veg.map((m) => `• ${m.name} — ₹${m.price}`).join('\n')}\n\nKisi ka naam bolo, me add karne me help karta hu.`,
      addId: null,
    };
  }
  return {
    text: en
      ? 'I am the 7 Cheese Pizza assistant! Ask me anything about menu, prices, veg/non-veg, offers or order tracking. Try: "veg pizza under 250" or "best deals?"'
      : 'Me 7 Cheese Pizza assistant hu! Menu, price, veg/non-veg, offers ya order tracking — kuch bhi pucho. Jaise: "veg pizza under 250" ya "best deals?"',
    addId: null,
  };
}

export const ChatAssistant: React.FC<ChatAssistantProps> = ({
  menuItems,
  coupons,
  hasCart = false,
  onAddToCart,
  onOpenCustomize,
  onSelectCategory,
}) => {
  const [open, setOpen] = useState(false);
  // Other UI (e.g. the profile drawer's "Need Help?") opens the chat via this event.
  useEffect(() => {
    const openChat = () => setOpen(true);
    window.addEventListener('seven-cheese:open-chat', openChat);
    return () => window.removeEventListener('seven-cheese:open-chat', openChat);
  }, []);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const [msgs, setMsgs] = useState<UiMsg[]>(() => {
    try {
      localStorage.removeItem(STORE_KEY);
    } catch {}
    return [
      {
        role: 'assistant',
        content: 'Namaste! Me 7 Cheese Pizza assistant hu 🍕 Menu recommend karu, best deal batau, ya order track karne me help karu?',
        addId: null,
      },
    ];
  });
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (open) setUnread(0);
  }, [msgs, open]);

  const menuDigest = useMemo(() => {
    return menuItems
      .slice(0, 45)
      .map((m) => `- ${m.name} (id:${m.id}) ₹${m.price} [${m.isVeg ? 'veg' : 'non-veg'}, ${m.category}]`)
      .join('\n');
  }, [menuItems]);

  const couponDigest = useMemo(() => {
    return coupons.map((c) => `- ${c.code}: ${c.description} (min ₹${c.minOrder})`).join('\n');
  }, [coupons]);

  const systemPrompt = useMemo(
    () =>
      `You are Cheesy, the friendly assistant for "7 Cheese Pizza" food ordering app. ` +
      `Mirror the user's language exactly — the per-message LANGUAGE RULE (sent with every request) overrides everything: English in → English out, Hinglish in → Hinglish out. ` +
      `Help with menu recommendations, prices, veg/non-veg filter, offers, delivery info (free delivery over ₹99 else ₹40, 5% tax + ₹15 charges, 25 min ETA), and order tracking steps (Reorder tab > Track Order). ` +
      `Keep replies short (under 90 words), use ₹ prices, no fake items/prices — use MENU only. ` +
      `When user clearly wants to order/add a specific item, end reply with [ADD:product-id] using exact id from MENU, one per reply, nothing after it.\n\nMENU:\n${menuDigest}\n\nCOUPONS:\n${couponDigest}`,
    [menuDigest, couponDigest]
  );

  const send = async (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text || loading) return;
    setInput('');
    const next: UiMsg[] = [...msgs, { role: 'user', content: text, addId: null }];
    setMsgs(next);
    setLoading(true);
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const lang = detectLang(text);
      const history: GroqChatMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'system', content: LANG_DIRECTIVE[lang] },
        ...next.slice(-10).map((m) => ({ role: m.role, content: m.content } as GroqChatMessage)),
      ];
      const reply = await chatWithGroq(history, { signal: ctrl.signal });
      const { clean, addId } = stripAddTag(reply);
      const validAdd = addId && menuItems.some((m) => m.id === addId) ? addId : null;
      setMsgs((p) => [...p, { role: 'assistant', content: clean, addId: validAdd }]);
      if (!open) setUnread((u) => u + 1);
    } catch (e: any) {
      if (e?.name === 'AbortError') return;
      const fb = offlineReply(text, menuItems, coupons, detectLang(text));
      setMsgs((p) => [...p, { role: 'assistant', content: fb.text, addId: fb.addId }]);
      if (!open) setUnread((u) => u + 1);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = (id: string) => {
    const item = menuItems.find((m) => m.id === id);
    if (!item) return;
    // Pizza hamesha modal se — chatbot se bhi direct add nahi.
    if (needsCustomize(item) && onOpenCustomize) {
      onOpenCustomize(item);
      setMsgs((p) => [...p, { role: 'assistant', content: `${item.name} ke liye size/crust select karo! 🍕`, addId: null }]);
    } else {
      onAddToCart(item);
      setMsgs((p) => [...p, { role: 'assistant', content: `${item.name} cart me add ho gaya! Cart khol ke checkout karo. 🛒`, addId: null }]);
    }
  };

  return (
    <>
      {/* Floating button — above bottom nav + cart banner */}
      {!open && (
        <button
          id="btn-chat-open"
          onClick={() => setOpen(true)}
          aria-label="Open pizza assistant"
          className={`fixed right-3 sm:right-4 z-50 w-11 h-11 sm:w-14 sm:h-14 rounded-full shadow-2xl overflow-hidden transition-all hover:scale-105 cursor-pointer border-2 border-white bg-white p-0 ${hasCart ? 'bottom-[158px] sm:bottom-[148px]' : 'bottom-[88px] sm:bottom-[88px]'}`}
        >
          <img src={AVATAR} alt="Pizza assistant" className="w-full h-full object-cover" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black flex items-center justify-center">
              {unread}
            </span>
          )}
          <span className="absolute -top-1 -left-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white" />
        </button>
      )}

      {open && (
        <div className={`fixed z-50 right-3 left-3 sm:left-auto sm:right-5 sm:w-[380px] h-[530px] max-h-[68vh] bg-white rounded-3xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden ${hasCart ? 'bottom-[158px] sm:bottom-[148px]' : 'bottom-[88px] sm:bottom-[88px]'}`}>
          {/* Header */}
          <div className="bg-gradient-to-r from-[#ED1C24] to-[#a3121f] text-white px-4 py-3 flex items-center gap-3">
            <img src={AVATAR} alt="Cheesy assistant" className="w-9 h-9 rounded-full object-cover border-2 border-white/60 bg-white" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black leading-tight">Cheesy — Pizza Assistant</p>
              <p className="text-[11px] text-white/80 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" /> Online
              </p>
            </div>
            <button
              id="btn-chat-clear"
              onClick={() => {
                setMsgs([{ role: 'assistant', content: 'Namaste! Main Cheesy hoon 🍕 Batao, kaunsi pizza khaane ka mood hai?', addId: null }]);
                try { localStorage.removeItem(STORE_KEY); } catch {}
              }}
              aria-label="Clear chat"
              className="p-1.5 rounded-lg hover:bg-white/20 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              id="btn-chat-close"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="p-1.5 rounded-lg hover:bg-white/20 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto no-scrollbar px-3 py-3 space-y-2.5 bg-slate-50">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-2xl text-[13px] leading-relaxed whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-[#ED1C24] text-white rounded-br-md'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-md shadow-xs'
                  }`}
                >
                  {m.content}
                  {m.role === 'assistant' && m.addId && (
                    <button
                      id={`btn-chat-add-${m.addId}`}
                      onClick={() => handleAdd(m.addId!)}
                      className="mt-2 w-full flex items-center justify-center gap-1.5 bg-[#ED1C24] hover:bg-[#c91430] text-white text-xs font-black px-3 py-1.5 rounded-xl cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add to Cart
                    </button>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-3 py-2.5 flex items-center gap-1.5">
                  <Loader2 className="w-4 h-4 animate-spin text-[#ED1C24]" />
                  <span className="text-xs text-slate-500 font-semibold">Cheesy soch raha hai…</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
            <input
              id="input-chat-msg"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') send();
              }}
              placeholder="Pizza, deal ya order pucho…"
              className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ED1C24]/40"
            />
            <button
              id="btn-chat-send"
              onClick={() => send()}
              disabled={loading || !input.trim()}
              aria-label="Send message"
              className="w-9 h-9 rounded-xl bg-[#ED1C24] hover:bg-[#c91430] disabled:opacity-40 text-white flex items-center justify-center cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
