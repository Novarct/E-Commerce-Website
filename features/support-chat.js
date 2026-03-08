/* =========================================
   FEATURE: Support Chat Panel
   Description: Slide-out AI customer support panel powered by Groq
   ========================================= */

import { AuthService } from '../services/auth-service.js';

// ── Config ───────────────────────────────────────────────────────────────────
const GROQ_API_KEY = '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';
const GROQ_MODEL   = 'llama-3.3-70b-versatile';

// ── System prompt: gives the AI full store context ───────────────────────────
const SYSTEM_PROMPT = `You are ÆTHER Support, the friendly AI customer service assistant for ÆTHER FORGE — a premium e-commerce store specialising in high-performance PC hardware (RAM, CPUs, GPUs, Motherboards, PSUs, Cooling, Cases).

Personality: Warm, concise, knowledgeable. Respond in SHORT answers (max 3–4 sentences or a small bullet list). Use bold (**word**) for key terms.

Store knowledge:
- Products: DDR5/DDR4 RAM, CPUs, GPUs, Motherboards, PSUs, Cooling, PC Cases — premium brands (Asus, Corsair, NZXT, Nvidia, AMD, Intel)
- Shipping: Standard ($9.99, 5–7 days), Express ($19.99, 2–3 days), International ($39.99, 10–14 days)
- Free Shipping: Only when ALL items in cart have a FREESHIP discount tag OR the FREESHIP coupon is applied
- Coupons: WELCOME10 (10% off, for new registered users only), FREESHIP (free shipping). Apply at checkout
- Returns: 30-day return policy, unused items in original packaging. Refund in 5–7 business days. Damaged items → email support@aetherforge.com marked URGENT
- Æ Points: Earned from purchases. Redeem in My Account → Exchange for coupon codes
- Order tracking: My Account → Order History → click "Track & Manage" on any order
- Account: Edit username in My Account, upload avatar, password reset via support email
- Contact: support@aetherforge.com | Mon–Fri 9AM–6PM UTC+7 | reply within 24 hours

Rules:
- Never invent policies, prices or features not listed above
- If a question is unrelated to the store, politely say you can only help with ÆTHER FORGE topics
- Keep every reply brief and helpful`;

// ── Fallback (when offline / API error) ─────────────────────────────────────
const FALLBACK_INTENTS = [
    { test: /\b(hi|hello|hey|good\s*(morning|afternoon|evening))/i,
      reply: () => `Hi there! 👋 I'm ÆTHER Support. How can I help you today?` },
    { test: /\b(order|track|packag|ship.*status)/i,
      reply: () => `To track your order: **My Account → Order History → Track & Manage**. 📦` },
    { test: /\b(ship|deliver|express|how long|arrival)/i,
      reply: () => `Shipping options:\n• **Standard** — $9.99 · 5–7 days\n• **Express** — $19.99 · 2–3 days\n• **International** — $39.99 · 10–14 days\n\nUse coupon **FREESHIP** for free shipping! 🚚` },
    { test: /\b(return|refund|exchange|cancel|broken|damage)/i,
      reply: () => `We offer **30-day returns** for unused items. Refunds within 5–7 business days. For damaged items, email support@aetherforge.com marked URGENT. ↩️` },
    { test: /\b(coupon|discount|promo|voucher|code|welcome|freeship)/i,
      reply: () => `Available coupons:\n• **WELCOME10** — 10% off (new users)\n• **FREESHIP** — free shipping\n\nApply at checkout! 🏷️` },
    { test: /\b(point|reward|redeem|loyalt|exchang)/i,
      reply: () => `Earn **Æ Points** with every purchase. Redeem them at **My Account → Exchange** for discount coupons! 💎` },
    { test: /\b(contact|human|agent|email|phone|call)/i,
      reply: () => `Reach us at **support@aetherforge.com** · Mon–Fri, 9AM–6PM UTC+7. We reply within 24 hours. 🧑‍💼` },
    { test: /\b(pay|payment|card|visa|mastercard|checkout)/i,
      reply: () => `We accept Visa, Mastercard, and PayPal. All payments are processed securely at checkout. 💳` },
    { test: /\b(bye|thank|done|that.?s all|goodbye)/i,
      reply: () => `Thanks for chatting! Happy building! ⚡` },
];

function getFallback(input) {
    for (const intent of FALLBACK_INTENTS) {
        if (intent.test.test(input)) return intent.reply();
    }
    return `I'm having trouble connecting right now. For immediate help, email **support@aetherforge.com** or try again shortly. 😊`;
}

// ── Groq API (OpenAI-compatible) ─────────────────────────────────────────────
/** 🌐 Query: Call Groq API */
async function callGroq(history) {
    const url = 'https://api.groq.com/openai/v1/chat/completions';
    const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...history
    ];

    const resp = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
            model: GROQ_MODEL,
            messages,
            max_tokens: 350,
            temperature: 0.65
        })
    });

    if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error?.message || 'API request failed');
    }
    const data = await resp.json();
    return data.choices[0].message.content.trim();
}

// ── DOM state ─────────────────────────────────────────────────────────────────
let chatPanel, chatOverlay, chatMessages, chatInput, chatSendBtn, chatNavBtn;
let hasGreeted   = false;
let isBotTyping  = false;
let conversationHistory = [];   // user+assistant turns sent to Groq

// ── Message rendering ────────────────────────────────────────────────────────
/** 🎨 Render: Append a message bubble to the chat panel */
function appendMessage(text, role) {
    const el = document.createElement('div');
    el.className = `chat-msg ${role}`;
    if (role === 'bot') {
        el.innerHTML = `
            <div class="msg-avatar">
                <img src="logo7.png" alt="ÆTHER" style="width:100%;height:100%;object-fit:contain;border-radius:50%;padding:4px;">
            </div>
            <div class="msg-bubble">${formatMd(text)}</div>`;
    } else {
        el.innerHTML = `<div class="msg-bubble">${escapeHtml(text)}</div>`;
    }
    chatMessages.appendChild(el);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return el;
}

/** 🎨 Render: Show the typing indicator animation */
function showTyping() {
    isBotTyping = true;
    const el = document.createElement('div');
    el.className = 'chat-msg bot typing';
    el.innerHTML = `
        <div class="msg-avatar">
            <img src="logo7.png" alt="ÆTHER" style="width:100%;height:100%;object-fit:contain;border-radius:50%;padding:4px;">
        </div>
        <div class="msg-bubble">
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
        </div>`;
    chatMessages.appendChild(el);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return el;
}

/** 🎨 Render: Hide the typing indicator animation */
function hideTyping() {
    const typingEl = chatMessages.querySelector('.chat-msg.bot.typing');
    if (typingEl) {
        typingEl.remove();
    }
    isBotTyping = false;
}

/** ⚙️ Action: Make URLs clickable and format simple markdown in chat */
function formatMd(text) {
    return escapeHtml(text)
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');
}
/** ⚙️ Action: Escape raw HTML input */
function escapeHtml(t) {
    return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ── Sending ──────────────────────────────────────────────────────────────────
/** ⚙️ Action: Handle sending a message to the AI */
async function handleSend(textOverride) {
    const text = (textOverride || chatInput.value).trim();
    if (!text || isBotTyping) return;

    chatInput.value = '';
    appendMessage(text, 'user');
    isBotTyping     = true;
    chatSendBtn.disabled = true;

    // Add to conversation history ONLY user turns here; assistant turns added after response
    conversationHistory.push({ role: 'user', content: text });

    showTyping();
    const minDelay = new Promise(r => setTimeout(r, 700));

    const aiReply = await callGroq(conversationHistory);
    
    // Ensure min delay for animation feel
    await minDelay;
    
    // Bot reply
    hideTyping();
    appendMessage(aiReply, 'bot');
    conversationHistory.push({ role: 'assistant', content: aiReply });

    isBotTyping = false;
    chatSendBtn.disabled = false;
    chatInput.focus();
}

// ── Drawer Integration ───────────────────────────────────────────────────────
/** ⚙️ Action: Open chat panel and trigger greeting if first time */
function openPanel() {
    chatPanel.classList.add('open');
    chatOverlay.classList.add('show');
    document.body.style.overflow = 'hidden';
    chatMessages.scrollTop = chatMessages.scrollHeight;

    if (!hasGreeted) {
        hasGreeted = true;
        const user = AuthService.getCurrentUser();
        const name = user.username || user.name;
        // Show greeting in UI only — NOT pushed to conversationHistory
        const greeting = name
            ? `Hey, **${name}**! 👋 I'm ÆTHER Support, your AI assistant. How can I help?`
            : `Hello! 👋 I'm ÆTHER Support, your AI assistant. Ask me anything about orders, shipping, coupons, or our products!`;
        setTimeout(() => {
            const t = showTyping();
            setTimeout(() => { hideTyping(); appendMessage(greeting, 'bot'); }, 800);
        }, 300);
    }
}

/** ⚙️ Action: Close chat panel */
function closePanel() {
    chatPanel.classList.remove('open');
    chatOverlay.classList.remove('show');
    document.body.style.overflow = '';
}

// ── Init ─────────────────────────────────────────────────────────────────────
/** ⚙️ Action: Initialize the support chat module */
export const initSupportChat = () => {
    chatPanel    = document.getElementById('support-chat-panel');
    chatOverlay  = document.getElementById('support-chat-overlay');
    chatMessages = document.getElementById('chat-messages');
    chatInput    = document.getElementById('chat-input');
    chatSendBtn  = document.getElementById('chat-send-btn');
    chatNavBtn   = document.getElementById('chat-nav-btn');



    // Show main chat section immediately (API key is built-in)
    const apiSetup   = document.getElementById('chat-api-setup');
    const mainSection = document.getElementById('chat-main-section');
    if (apiSetup)    apiSetup.style.display    = 'none';
    if (mainSection) mainSection.style.display = 'flex';

    // Nav icon triggers open/close
    chatNavBtn.addEventListener('click', e => {
        e.preventDefault();
        // Close mobile menu if open
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenu && mobileMenu.classList.contains('active')) {
            mobileMenu.classList.remove('active');
        }
        chatPanel.classList.contains('open') ? closePanel() : openPanel();
    });

    // Overlay + close button
    chatOverlay.addEventListener('click', closePanel);
    chatPanel.querySelector('.close-chat-support').addEventListener('click', closePanel);

    // Send
    chatSendBtn.addEventListener('click', () => handleSend());
    chatInput.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    });

    // Quick chips
    chatPanel.querySelectorAll('.quick-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            if (!chatPanel.classList.contains('open')) openPanel();
            setTimeout(() => handleSend(chip.dataset.msg), hasGreeted ? 50 : 1200);
        });
    });
};
