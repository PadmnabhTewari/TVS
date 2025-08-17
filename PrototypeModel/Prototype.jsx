<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>TVS SAATHI — Multipage Prototype (Single File)</title>
  <!-- Tailwind via CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            primary: { DEFAULT: '#111827' },
            accent: { DEFAULT: '#2563eb' }
          },
          boxShadow: {
            soft: '0 1px 2px rgba(0,0,0,0.06), 0 4px 8px rgba(0,0,0,0.06)'
          }
        }
      }
    }
  </script>
  <style>
    * { scrollbar-width: thin; scrollbar-color: #CBD5E1 transparent; }
    *::-webkit-scrollbar { height: 8px; width: 8px; }
    *::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 8px; }
    html, body, #root { height: 100%; }
    .card { @apply bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-soft; }
    .btn { @apply inline-flex items-center gap-2 px-3 py-2 text-sm rounded-2xl border border-slate-200 dark:border-slate-700 transition; }
    .btn-primary { @apply bg-primary text-white border-primary hover:opacity-90; }
    .btn-outline { @apply bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800; }
    .badge { @apply inline-flex items-center text-xs px-2 py-1 rounded-2xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900; }
    .input { @apply w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600; }
  </style>
</head>
<body class="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
  <div id="root" class="h-full"></div>

  <!-- React + ReactDOM + React Router (UMD builds) -->
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-router-dom@6/umd/react-router-dom.development.js"></script>

  <script>
  (() => {
    const { useState, useEffect, useMemo, useRef } = React;
    const { createRoot } = ReactDOM;
    const { BrowserRouter, Routes, Route, Link, NavLink, useNavigate } = ReactRouterDOM;

    const uid = (p = 'id') => p + '_' + Math.random().toString(36).slice(2, 10);
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    const SAMPLE_CUSTOMERS = [
      {
        id: "CUST-1001",
        name: "Asha Verma",
        phone: "9876543210",
        language: "en",
        loans: [
          { loanID: "TW-2023-001", product: "Two-Wheeler", balance: 15430, dueDate: "2025-09-05", status: "Active" },
          { loanID: "CD-2024-113", product: "Consumer Durable", balance: 2899, dueDate: "2025-08-28", status: "Active" }
        ],
        kyc: { pan: "ABCDE1234F", aadhaar: "XXXX-XXXX-1111" },
        preferences: { whatsappOptIn: true },
      },
      {
        id: "CUST-1002",
        name: "Ravi Kumar",
        phone: "9810012345",
        language: "hi",
        loans: [
          { loanID: "TW-2022-777", product: "Two-Wheeler", balance: 2210, dueDate: "2025-08-20", status: "Active" },
        ],
        kyc: { pan: "XYZAB4321Q", aadhaar: "XXXX-XXXX-2222" },
        preferences: { whatsappOptIn: false },
      },
    ];

    const ToolLatencyMs = 450;
    const ToolAPI = {
      async getLoanDetails(loanID) {
        await sleep(ToolLatencyMs);
        const loan = SAMPLE_CUSTOMERS.flatMap(c => c.loans).find(l => l.loanID === loanID);
        if (!loan) throw new Error("Loan not found");
        return { ok: true, data: loan };
      },
      async getPaymentHistory(loanID) {
        await sleep(ToolLatencyMs);
        const items = Array.from({ length: 5 }, (_, i) => ({
          id: uid("pay"),
          loanID,
          amount: [799, 999, 1200, 1500, 2000][i % 5],
          date: new Date(Date.now() - i * 28 * 86400000).toISOString().slice(0, 10),
          method: ["UPI", "Card", "NetBanking"][i % 3]
        }));
        return { ok: true, data: items };
      },
      async generatePaymentLink(loanID, amount) {
        await sleep(ToolLatencyMs);
        return { ok: true, data: { url: `https://pay.tvscredit.in/link/${loanID}/${amount}` } };
      },
      async updateCustomerInfo(customerID, field, value) {
        await sleep(ToolLatencyMs);
        const cust = SAMPLE_CUSTOMERS.find(c => c.id === customerID);
        if (!cust) throw new Error("Customer not found");
        if (field === "phone") cust.phone = value;
        if (field === "language") cust.language = value;
        return { ok: true, data: { customerID, field, value } };
      },
      async createServiceTicket(customerID, issue_description) {
        await sleep(ToolLatencyMs);
        const ticket = { id: uid("TKT"), customerID, issue_description, status: "OPEN" };
        return { ok: true, data: ticket };
      },
      async checkEligibility(customerID, product_type) {
        await sleep(ToolLatencyMs);
        const cust = SAMPLE_CUSTOMERS.find(c => c.id === customerID);
        const totalBal = (cust?.loans || []).reduce((s, l) => s + l.balance, 0);
        const eligible = totalBal < 20000;
        return { ok: true, data: { eligible, score: Math.max(0, 850 - totalBal / 50), product_type } };
      },
    };

    const Memory = {
      load() {
        const raw = localStorage.getItem("saathi_memory_v2");
        return raw ? JSON.parse(raw) : { longTerm: [], shortTerm: [] };
      },
      save(mem) { localStorage.setItem("saathi_memory_v2", JSON.stringify(mem)); },
      addShort(e) { const m = Memory.load(); m.shortTerm.unshift({ id: uid("evt"), ts: Date.now(), ...e }); m.shortTerm = m.shortTerm.slice(0,64); Memory.save(m); return m; },
      addLong(f) { const m = Memory.load(); m.longTerm.unshift({ id: uid("fact"), ts: Date.now(), ...f }); m.longTerm = m.longTerm.slice(0,256); Memory.save(m); return m; },
      clear() { localStorage.removeItem("saathi_memory_v2"); }
    };

    function AppShell({ children }) {
      const [dark, setDark] = useState(() => window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
      useEffect(() => {
        document.documentElement.classList.toggle('dark', dark);
      }, [dark]);
      return (
        React.createElement('div', { className: "h-full flex flex-col" },
          React.createElement('header', { className: "sticky top-0 z-30 backdrop-blur bg-white/70 dark:bg-slate-900/70 border-b border-slate-200/80 dark:border-slate-800" },
            React.createElement('div', { className: "max-w-7xl mx-auto px-4 py-3 flex items-center gap-3" },
              React.createElement('div', { className: "font-bold text-lg" }, "TVS SAATHI"),
              React.createElement('nav', { className: "ml-4 flex items-center gap-2 text-sm" },
                React.createElement(NavLink, { to: "/", end: true, className: ({isActive}) => "px-3 py-1.5 rounded-2xl " + (isActive ? "bg-slate-900 text-white" : "hover:bg-slate-100 dark:hover:bg-slate-800")}, "Dashboard"),
                React.createElement(NavLink, { to: "/customers", className: ({isActive}) => "px-3 py-1.5 rounded-2xl " + (isActive ? "bg-slate-900 text-white" : "hover:bg-slate-100 dark:hover:bg-slate-800")}, "Customers"),
                React.createElement(NavLink, { to: "/agent", className: ({isActive}) => "px-3 py-1.5 rounded-2xl " + (isActive ? "bg-slate-900 text-white" : "hover:bg-slate-100 dark:hover:bg-slate-800")}, "Agent"),
                React.createElement(NavLink, { to: "/tools", className: ({isActive}) => "px-3 py-1.5 rounded-2xl " + (isActive ? "bg-slate-900 text-white" : "hover:bg-slate-100 dark:hover:bg-slate-800")}, "Tools"),
                React.createElement(NavLink, { to: "/memory", className: ({isActive}) => "px-3 py-1.5 rounded-2xl " + (isActive ? "bg-slate-900 text-white" : "hover:bg-slate-100 dark:hover:bg-slate-800")}, "Memory"),
                React.createElement(NavLink, { to: "/settings", className: ({isActive}) => "px-3 py-1.5 rounded-2xl " + (isActive ? "bg-slate-900 text-white" : "hover:bg-slate-100 dark:hover:bg-slate-800")}, "Settings"),
                React.createElement(NavLink, { to: "/roadmap", className: ({isActive}) => "px-3 py-1.5 rounded-2xl " + (isActive ? "bg-slate-900 text-white" : "hover:bg-slate-100 dark:hover:bg-slate-800")}, "Roadmap"),
                React.createElement(NavLink, { to: "/about", className: ({isActive}) => "px-3 py-1.5 rounded-2xl " + (isActive ? "bg-slate-900 text-white" : "hover:bg-slate-100 dark:hover:bg-slate-800")}, "About")
              ),
              React.createElement('div', { className: "ml-auto flex items-center gap-2" },
                React.createElement('button', { className: "btn btn-outline", onClick: () => setDark(d => !d) }, dark ? "☀️ Light" : "🌙 Dark"),
                React.createElement('a', { className: "btn btn-primary", href: "#", onClick: (e) => { e.preventDefault(); alert('SSO placeholder'); } }, "Login")
              )
            )
          ),
          React.createElement('main', { className: "flex-1" },
            React.createElement('div', { className: "max-w-7xl mx-auto p-4" }, children)
          ),
          React.createElement('footer', { className: "border-t border-slate-200 dark:border-slate-800 py-3 text-center text-xs opacity-70" },
            "© ", new Date().getFullYear(), " TVS SAATHI Prototype · Built for TVS Hackathon by Padmnabh Tewari"
          )
        )
      );
    }

    function KPI({ title, value, hint }) {
      return React.createElement('div', { className: "card p-4" },
        React.createElement('div', { className: "text-sm opacity-70" }, title),
        React.createElement('div', { className: "text-2xl font-semibold mt-1" }, value),
        hint && React.createElement('div', { className: "text-xs opacity-60 mt-1" }, hint)
      );
    }

    function Dashboard() {
      return (
        React.createElement('div', { className: "space-y-4" },
          React.createElement('div', { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3" },
            React.createElement(KPI, { title: "CSAT (demo)", value: "4.7/5", hint: "last 30 days" }),
            React.createElement(KPI, { title: "First Contact Resolution", value: "78%", hint: "target 85%" }),
            React.createElement(KPI, { title: "On-time EMI", value: "92%", hint: "nudges enabled" }),
            React.createElement(KPI, { title: "Avg Handle Time", value: "2m 31s", hint: "voice beta" }),
          ),
          React.createElement('div', { className: "grid grid-cols-1 lg:grid-cols-3 gap-4" },
            React.createElement('div', { className: "card p-4 lg:col-span-2" },
              React.createElement('div', { className: "font-semibold mb-3" }, "Recent Activity"),
              React.createElement('ul', { className: "space-y-2 text-sm" },
                React.createElement('li', { className: "p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800" }, "Asha Verma paid ₹1,200 via UPI · 3h ago"),
                React.createElement('li', { className: "p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800" }, "Ravi Kumar requested a payment link · 6h ago"),
                React.createElement('li', { className: "p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800" }, "New ticket opened for address change · 1d ago")
              )
            ),
            React.createElement('div', { className: "card p-4" },
              React.createElement('div', { className: "font-semibold mb-3" }, "Quick Actions"),
              React.createElement('div', { className: "grid grid-cols-2 gap-2" },
                React.createElement('button', { className: "btn btn-outline", onClick: () => alert('Telephony placeholder') }, "📞 Dial Out"),
                React.createElement('button', { className: "btn btn-outline", onClick: () => alert('KYC placeholder') }, "🛡️ KYC Verify"),
                React.createElement('button', { className: "btn btn-outline", onClick: () => alert('Doc scan placeholder') }, "🧾 Doc Scan"),
                React.createElement('a', { className: "btn btn-primary", href: "#/agent" }, "🤖 Open Agent")
              )
            )
          )
        )
      );
    }

    function Customers() {
      const [q, setQ] = useState('');
      const list = useMemo(() => {
        const t = q.toLowerCase();
        return SAMPLE_CUSTOMERS.filter(c => c.name.toLowerCase().includes(t) || c.phone.includes(t) || c.id.toLowerCase().includes(t));
      }, [q]);
      const nav = useNavigate();
      return (
        React.createElement('div', { className: "space-y-3" },
          React.createElement('div', { className: "flex gap-2" },
            React.createElement('input', { className: "input", placeholder: "Search by name / phone / ID…", value: q, onChange: (e) => setQ(e.target.value) }),
            React.createElement('button', { className: "btn btn-primary", onClick: () => setQ(q) }, "Search")
          ),
          React.createElement('div', { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3" },
            list.map(c =>
              React.createElement('div', { key: c.id, className: "card p-4" },
                React.createElement('div', { className: "flex items-center justify-between" },
                  React.createElement('div', null,
                    React.createElement('div', { className: "font-semibold" }, c.name),
                    React.createElement('div', { className: "text-xs opacity-60" }, c.id, " · ", c.phone)
                  ),
                  React.createElement('span', { className: "badge" }, c.language.toUpperCase())
                ),
                React.createElement('div', { className: "mt-3 text-sm" },
                  c.loans.map(l => React.createElement('div', { key: l.loanID, className: "p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 mb-2" },
                    React.createElement('div', { className: "font-medium" }, l.product, " · ", l.loanID),
                    React.createElement('div', { className: "text-xs opacity-70" }, "Balance ₹", l.balance, " · Due ", l.dueDate)
                  ))
                ),
                React.createElement('div', { className: "mt-3 flex gap-2" },
                  React.createElement('button', { className: "btn btn-outline", onClick: () => nav('/agent', { state: { customerID: c.id } }) }, "Open in Agent"),
                  React.createElement('button', { className: "btn btn-primary", onClick: () => alert('Profile edit placeholder') }, "Edit Profile")
                )
              )
            )
          )
        )
      );
    }

    function simpleNLU(text) {
      const t = text.toLowerCase();
      const intents = [];
      if (/balance|outstanding|due/.test(t)) intents.push({ type: "get_balance" });
      if (/payment link|pay link|link/.test(t)) intents.push({ type: "payment_link", amount: parseInt((t.match(/\b(\d{3,7})\b/)||[])[1] || "0", 10) || undefined });
      if (/update|change/.test(t) && /(number|phone|contact)/.test(t)) intents.push({ type: "update_phone", phone: (t.match(/(\+?\d{10,13})/)||[])[1] });
      if (/eligib|pre-?approved|can i get/.test(t)) intents.push({ type: "check_eligibility", product: /personal|insta|tw|two/.test(t) ? "Personal Loan" : "Generic" });
      if (/history/.test(t)) intents.push({ type: "payment_history" });
      if (/help|issue|problem|complain/.test(t)) intents.push({ type: "create_ticket", description: text });
      return intents.length ? intents : [{ type: "chitchat" }];
    }

    function planFromIntents(intents, context) {
      const steps = [];
      intents.forEach((intent) => {
        if (intent.type === "get_balance") {
          const loanID = context?.loans?.[0]?.loanID;
          steps.push({ id: uid("step"), goal: "Fetch loan balance", tool: "getLoanDetails", args: { loanID }, intent });
        }
        if (intent.type === "payment_link") {
          const loanID = context?.loans?.[0]?.loanID;
          steps.push({ id: uid("step"), goal: "Generate payment link", tool: "generatePaymentLink", args: { loanID, amount: intent.amount || 1000 }, intent });
        }
        if (intent.type === "update_phone") {
          steps.push({ id: uid("step"), goal: "Update contact phone", tool: "updateCustomerInfo", args: { customerID: context?.id, field: "phone", value: intent.phone }, intent });
        }
        if (intent.type === "check_eligibility") {
          steps.push({ id: uid("step"), goal: "Check product eligibility", tool: "checkEligibility", args: { customerID: context?.id, product_type: intent.product }, intent });
        }
        if (intent.type === "payment_history") {
          const loanID = context?.loans?.[0]?.loanID;
          steps.push({ id: uid("step"), goal: "Get payment history", tool: "getPaymentHistory", args: { loanID }, intent });
        }
        if (intent.type === "create_ticket") {
          steps.push({ id: uid("step"), goal: "Create service ticket", tool: "createServiceTicket", args: { customerID: context?.id, issue_description: intent.description }, intent });
        }
        if (intent.type === "chitchat") {
          steps.push({ id: uid("step"), goal: "Small talk", tool: null, args: {}, intent });
        }
      });
      return steps;
    }

    function Agent() {
      const [customer, setCustomer] = useState(SAMPLE_CUSTOMERS[0]);
      const [messages, setMessages] = useState([
        { id: uid('m'), role: "agent", text: "Hello, I am SAATHI, your personal TVS Credit AI companion. How can I help today?" }
      ]);
      const [query, setQuery] = useState('');
      const [plan, setPlan] = useState([]);
      const [logs, setLogs] = useState([]);
      const [busy, setBusy] = useState(false);
      const endRef = useRef(null);

      useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

      const sendUser = async (text) => {
        if (!text.trim()) return;
        setMessages(m => [...m, { id: uid('m'), role: 'user', text }]);
        Memory.addShort({ type: "user_msg", text });

        const intents = simpleNLU(text);
        const steps = planFromIntents(intents, customer);
        setPlan(steps);
        setBusy(true);

        const outputs = [];
        for (const step of steps) {
          if (!step.tool) {
            outputs.push({ step, ok: true, result: { text: "I’m here to help with balances, payment links, updates and more." } });
            continue;
          }
          try {
            const result = await ToolAPI[step.tool](...(Object.values(step.args)));
            const log = { id: uid("log"), ts: Date.now(), tool: step.tool, args: step.args, ok: result.ok, result: result.data };
            setLogs(l => [log, ...l].slice(0, 64));
            Memory.addShort({ type: "tool_call", ...log });
            outputs.push({ step, ...result });
          } catch (e) {
            const log = { id: uid("log"), ts: Date.now(), tool: step.tool, args: step.args, ok: false, result: { error: e.message } };
            setLogs(l => [log, ...l].slice(0, 64));
            outputs.push(log);
          }
        }

        const parts = [];
        for (const out of outputs) {
          if (out.step?.intent?.type === "get_balance" && out.ok) {
            parts.push(`Your ${out.result.product} loan (${out.result.loanID}) outstanding is ₹${out.result.balance}. Next due: ${out.result.dueDate}.`);
          }
          if (out.step?.intent?.type === "payment_link" && out.ok) {
            parts.push(`Here is your secure payment link: ${out.result.url}`);
          }
          if (out.step?.intent?.type === "update_phone") {
            if (out.ok) { parts.push(`Got it. I’ve updated your contact number to ${out.step.args.value}.`); Memory.addLong({ type: "profile", field: "phone", value: out.step.args.value }); }
            else parts.push("I couldn’t update the phone right now. I can connect you to a human expert.");
          }
          if (out.step?.intent?.type === "check_eligibility" && out.ok) {
            parts.push(out.result.eligible ? `You look eligible for ${out.result.product_type}. Indicative score: ${Math.round(out.result.score)}.` : `It seems you may not be eligible right now. I can arrange a callback to review options.`);
          }
          if (out.step?.intent?.type === "payment_history" && out.ok) {
            parts.push(`I’ve pulled your last ${out.result.length} payments. Would you like me to email the statement?`);
          }
          if (out.step?.intent?.type === "create_ticket" && out.ok) {
            parts.push(`I’ve created a service ticket (${out.result.id}). Our team will reach out shortly.`);
          }
          if (out.step?.intent?.type === "chitchat") {
            parts.push(out.result?.text || "I’m here to help.");
          }
        }
        if (!parts.length) parts.push("I want to be accurate. Could you rephrase that?");

        const agentMsg = { id: uid("m"), role: "agent", text: parts.join("\n\n") };
        setMessages(m => [...m, agentMsg]);
        Memory.addShort({ type: "agent_msg", text: agentMsg.text });
        setBusy(false);
      };

      return (
        React.createElement('div', { className: "grid grid-cols-1 lg:grid-cols-3 gap-4" },
          React.createElement('div', { className: "space-y-4" },
            React.createElement('div', { className: "card p-4" },
              React.createElement('div', { className: "flex items-center justify-between" },
                React.createElement('div', null,
                  React.createElement('div', { className: "font-semibold" }, customer.name),
                  React.createElement('div', { className: "text-xs opacity-60" }, customer.id, " · ", customer.phone)
                ),
                React.createElement('span', { className: "badge" }, customer.language.toUpperCase())
              ),
              React.createElement('div', { className: "mt-3 text-sm" },
                customer.loans.map(l => React.createElement('div', { key: l.loanID, className: "p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 mb-2" },
                  React.createElement('div', { className: "font-medium" }, l.product, " · ", l.loanID),
                  React.createElement('div', { className: "text-xs opacity-70" }, "Balance ₹", l.balance, " · Due ", l.dueDate)
                ))
              ),
              React.createElement('div', { className: "mt-3 grid grid-cols-2 gap-2" },
                React.createElement('button', { className: "btn btn-outline", onClick: () => alert('SSO placeholder') }, "🛡️ KYC Verify"),
                React.createElement('button', { className: "btn btn-outline", onClick: () => alert('Doc scan placeholder') }, "🧾 Doc Scan"),
                React.createElement('button', { className: "btn btn-outline", onClick: () => alert('Handoff placeholder') }, "🎧 Human Handoff"),
                React.createElement('button', { className: "btn btn-outline", onClick: () => alert('Dial out placeholder') }, "📞 Dial Out")
              )
            ),
            React.createElement('div', { className: "card p-4" },
              React.createElement('div', { className: "font-semibold mb-2" }, "Canned Prompts"),
              React.createElement('div', { className: "grid grid-cols-2 gap-2" },
                ["What's my balance?", "Generate payment link 1200", "Change my phone to 9898989898", "Show my payment history", "Am I eligible for personal loan?", "I have an issue"].map(t =>
                  React.createElement('button', { key: t, className: "btn btn-outline", onClick: () => sendUser(t) }, t)
                )
              )
            )
          ),
          React.createElement('div', { className: "card p-4 flex flex-col h-[70vh]" },
            React.createElement('div', { className: "font-semibold mb-2" }, "Agentic Chat"),
            React.createElement('div', { className: "flex-1 overflow-auto space-y-2 pr-1" },
              messages.map(m => React.createElement('div', { key: m.id, className: (m.role === 'user') ? "flex justify-end" : "flex justify-start" },
                React.createElement('div', { className: (m.role === 'user') ? "max-w-[70%] bg-accent text-white rounded-2xl px-3 py-2" : "max-w-[70%] bg-slate-100 dark:bg-slate-900 rounded-2xl px-3 py-2" },
                  React.createElement('div', { className: "whitespace-pre-wrap text-sm" }, m.text)
                )
              )),
              React.createElement('div', { ref: endRef })
            ),
            React.createElement('div', { className: "mt-3 flex gap-2" },
              React.createElement('input', { className: "input flex-1", placeholder: "Type a request… (e.g., what's my balance?)", value: query, onChange: (e) => setQuery(e.target.value), onKeyDown: (e) => { if (e.key === 'Enter') { sendUser(query); setQuery(''); } } }),
              React.createElement('button', { className: "btn btn-primary", disabled: busy || !query.trim(), onClick: () => { sendUser(query); setQuery(''); } }, busy ? "…" : "Send")
            ),
            React.createElement('div', { className: "text-[11px] mt-2 opacity-60" }, "For demo: data is synthetic; tools are mocked via secure gateway abstraction.")
          ),
          React.createElement('div', { className: "space-y-4" },
            React.createElement('div', { className: "card p-4" },
              React.createElement('div', { className: "font-semibold mb-2" }, "Planner"),
              plan.length ? plan.map((s, i) =>
                React.createElement('div', { key: s.id, className: "p-2 rounded-xl border border-slate-200 dark:border-slate-800 mb-2" },
                  React.createElement('div', { className: "text-sm font-medium" }, "Step ", (i+1), ": ", s.goal),
                  React.createElement('div', { className: "text-xs opacity-70 mt-1" }, "Tool: ", s.tool || "—", " · Args: ", JSON.stringify(s.args)),
                  React.createElement('div', { className: "text-xs opacity-70 mt-1" }, "Intent: ", s.intent.type)
                )
              ) : React.createElement('div', { className: "text-sm opacity-60" }, "No active plan")
            ),
            React.createElement('div', { className: "card p-4 max-h-[40vh] overflow-auto" },
              React.createElement('div', { className: "font-semibold mb-2" }, "Tool Logs"),
              React.createElement('div', { className: "space-y-2 text-xs" },
                logs.map(l => React.createElement('div', { key: l.id || uid('log'), className: "p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800" },
                  React.createElement('div', null, React.createElement('span', { className: "badge" }, l.tool || 'tool'), " ", new Date(l.ts || Date.now()).toLocaleString() ),
                  React.createElement('div', { className: "mt-1 font-mono break-all" }, "args: ", JSON.stringify(l.args)),
                  React.createElement('div', { className: "font-mono break-all" }, "result: ", JSON.stringify(l.result))
                ))
              )
            )
          )
        )
      );
    }

    function Tools() {
      const [customer] = useState(SAMPLE_CUSTOMERS[0]);
      const [logs, setLogs] = useState([]);
      const call = async (tool, args) => {
        try {
          const res = await ToolAPI[tool](...(Object.values(args || {})));
          const log = { id: uid('log'), ts: Date.now(), tool, args, result: res.data, ok: true };
          setLogs(l => [log, ...l]);
        } catch (e) {
          const log = { id: uid('log'), ts: Date.now(), tool, args, result: { error: e.message }, ok: false };
          setLogs(l => [log, ...l]);
        }
      };
      const loanID = customer.loans[0].loanID;
      return (
        React.createElement('div', { className: "grid grid-cols-1 lg:grid-cols-3 gap-4" },
          React.createElement('div', { className: "card p-4 space-y-2" },
            React.createElement('div', { className: "font-semibold mb-2" }, "Manual Tool Invocations"),
            React.createElement('button', { className: "btn btn-outline", onClick: () => call('getLoanDetails', { loanID }) }, "getLoanDetails(", loanID, ")"),
            React.createElement('button', { className: "btn btn-outline", onClick: () => call('getPaymentHistory', { loanID }) }, "getPaymentHistory(", loanID, ")"),
            React.createElement('button', { className: "btn btn-outline", onClick: () => call('generatePaymentLink', { loanID, amount: 1200 }) }, "generatePaymentLink(", loanID, ", 1200)"),
            React.createElement('button', { className: "btn btn-outline", onClick: () => call('updateCustomerInfo', { customerID: customer.id, field: 'language', value: 'hi' }) }, "updateCustomerInfo(language → hi)"),
            React.createElement('button', { className: "btn btn-outline", onClick: () => call('createServiceTicket', { customerID: customer.id, issue_description: 'Demo Issue' }) }, "createServiceTicket()"),
            React.createElement('button', { className: "btn btn-outline", onClick: () => call('checkEligibility', { customerID: customer.id, product_type: 'Personal Loan' }) }, "checkEligibility(Personal Loan)")
          ),
          React.createElement('div', { className: "card p-4 lg:col-span-2" },
            React.createElement('div', { className: "font-semibold mb-2" }, "Logs"),
            React.createElement('div', { className: "space-y-2 max-h-[60vh] overflow-auto text-xs" },
              logs.map(l => React.createElement('div', { key: l.id, className: "p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800" },
                React.createElement('div', null, React.createElement('span', { className: "badge" }, l.ok ? "OK" : "ERR"), " · ", l.tool, " · ", new Date(l.ts).toLocaleString()),
                React.createElement('div', { className: "font-mono break-all" }, "args: ", JSON.stringify(l.args)),
                React.createElement('div', { className: "font-mono break-all" }, "result: ", JSON.stringify(l.result))
              ))
            )
          )
        )
      );
    }

    function MemoryPage() {
      const [mem, setMem] = useState(Memory.load());
      useEffect(() => {
        const i = setInterval(() => setMem(Memory.load()), 500);
        return () => clearInterval(i);
      }, []);
      return (
        React.createElement('div', { className: "grid grid-cols-1 lg:grid-cols-2 gap-4" },
          React.createElement('div', { className: "card p-4" },
            React.createElement('div', { className: "font-semibold mb-2" }, "Long-term"),
            mem.longTerm.length ? mem.longTerm.map(x =>
              React.createElement('div', { key: x.id, className: "p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 mb-2" },
                React.createElement('div', { className: "text-xs" }, JSON.stringify(x)),
                React.createElement('div', { className: "text-[10px] opacity-60" }, new Date(x.ts).toLocaleString())
              )
            ) : React.createElement('div', { className: "text-sm opacity-60" }, "No long-term memory yet.")
          ),
          React.createElement('div', { className: "card p-4" },
            React.createElement('div', { className: "font-semibold mb-2" }, "Short-term"),
            mem.shortTerm.length ? mem.shortTerm.map(x =>
              React.createElement('div', { key: x.id, className: "p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 mb-2" },
                React.createElement('div', { className: "text-xs truncate" }, x.type, ": ", x.text || x.tool),
                React.createElement('div', { className: "text-[10px] opacity-60" }, new Date(x.ts).toLocaleString())
              )
            ) : React.createElement('div', { className: "text-sm opacity-60" }, "No short-term memory yet."),
            React.createElement('div', { className: "mt-2" },
              React.createElement('button', { className: "btn btn-outline", onClick: () => { Memory.clear(); setMem(Memory.load()); } }, "Clear Memory")
            )
          )
        )
      );
    }

    function Settings() {
      const [voice, setVoice] = useState(false);
      const [lang, setLang] = useState('en');
      const [threshold, setThreshold] = useState(0.4);
      return (
        React.createElement('div', { className: "grid grid-cols-1 lg:grid-cols-2 gap-4" },
          React.createElement('div', { className: "card p-4" },
            React.createElement('div', { className: "font-semibold mb-3" }, "Agent Controls"),
            React.createElement('div', { className: "flex items-center justify-between mb-2" },
              React.createElement('div', { className: "text-sm" }, "Voice Mode"),
              React.createElement('button', { className: "btn btn-outline", onClick: () => setVoice(v => !v) }, voice ? "On" : "Off")
            ),
            React.createElement('div', { className: "flex items-center justify-between mb-2" },
              React.createElement('div', { className: "text-sm" }, "Language"),
              React.createElement('div', { className: "flex gap-2" },
                ['en','hi','ta','te','kn'].map(l =>
                  React.createElement('button', { key: l, className: "btn " + (lang === l ? "btn-primary" : "btn-outline"), onClick: () => setLang(l) }, l.toUpperCase())
                )
              )
            ),
            React.createElement('div', { className: "flex items-center justify-between" },
              React.createElement('div', { className: "text-sm" }, "Confidence Threshold"),
              React.createElement('input', { className: "w-48", type: "range", min: 0, max: 1, step: 0.05, value: threshold, onChange: (e) => setThreshold(parseFloat(e.target.value)) })
            )
          ),
          React.createElement('div', { className: "card p-4" },
            React.createElement('div', { className: "font-semibold mb-3" }, "Integration Checklist"),
            React.createElement('ul', { className: "space-y-2 text-sm" },
              React.createElement('li', null, "✓ WhatsApp Business API (Phase 1)"),
              React.createElement('li', null, "✓ API Gateway scaffolding (mocked)"),
              React.createElement('li', null, "△ STT/TTS provider integration (Phase 2)"),
              React.createElement('li', null, "△ CRM write scopes & audit (Phase 2)"),
              React.createElement('li', null, "△ Outbound campaign service (Phase 3)")
            )
          )
        )
      );
    }

    function Roadmap() {
      return (
        React.createElement('div', { className: "grid grid-cols-1 lg:grid-cols-3 gap-4" },
          ["Phase 1 — Listener", "Phase 2 — Helper", "Phase 3 — Proactive"].map((title, idx) =>
            React.createElement('div', { key: idx, className: "card p-4" },
              React.createElement('div', { className: "font-semibold mb-2" }, title),
              React.createElement('div', { className: "text-sm opacity-80" },
                idx === 0 ? "WhatsApp read-only assistant for Two-Wheeler loans. Intent → KB → Answers. (This prototype covers conversational core + memory.)" :
                idx === 1 ? "Add voice (STT/TTS), enable transactional tools (links, profile updates). (Demonstrated via mocked tools.)" :
                            "Outbound nudges, reminders, intelligent cross-sell. (Scaffolded via eligibility checks.)"
              )
            )
          )
        )
      );
    }

    function About() {
      return (
        React.createElement('div', { className: "card p-6" },
          React.createElement('div', { className: "text-xl font-semibold mb-2" }, "TVS SAATHI — A Strategic & Technical Blueprint"),
          React.createElement('div', { className: "opacity-80" }, "Project Lead: Padmnabh Tewari · Submission Date: August 17, 2025"),
          React.createElement('div', { className: "mt-3 text-sm leading-relaxed" },
            "SAATHI is an agentic AI for TVS Credit that remembers, reasons and acts via secure tools. ",
            "This multipage prototype demonstrates the UX, planning loop, memory, and mocked integrations in a single file."
          )
        )
      );
    }

    function App() {
      return (
        React.createElement(BrowserRouter, null,
          React.createElement(AppShell, null,
            React.createElement(Routes, null,
              React.createElement(Route, { path: "/", element: React.createElement(Dashboard) }),
              React.createElement(Route, { path: "/customers", element: React.createElement(Customers) }),
              React.createElement(Route, { path: "/agent", element: React.createElement(Agent) }),
              React.createElement(Route, { path: "/tools", element: React.createElement(Tools) }),
              React.createElement(Route, { path: "/memory", element: React.createElement(MemoryPage) }),
              React.createElement(Route, { path: "/settings", element: React.createElement(Settings) }),
              React.createElement(Route, { path: "/roadmap", element: React.createElement(Roadmap) }),
              React.createElement(Route, { path: "/about", element: React.createElement(About) }),
            )
          )
        )
      );
    }

    createRoot(document.getElementById('root')).render(React.createElement(App));
  })();
  </script>
</body>
</html>
