import React, { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import {
  Bot,
  Brain,
  CreditCard,
  Database,
  FileText,
  Headphones,
  History,
  Languages,
  Link as LinkIcon,
  Loader2,
  MessageCircle,
  Mic,
  Phone,
  ScanText,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  User,
  Wand2,
  Wrench,
  Zap
} from "lucide-react";

/**
 * TVS SAATHI — Single-file Wireframe + Clickable Prototype
 * --------------------------------------------------------
 * - Zero-backend mock: safely runs in the preview using in-memory + localStorage state
 * - Demonstrates the Agentic loop: Understand → Plan → Tool-use → Respond → Learn
 * - Includes a mocked API Gateway for tools listed in the spec
 * - Shows memory (vector-ish), planner, and observability panes
 * - Production-ish styling with Tailwind + shadcn/ui + framer-motion
 *
 * How to use:
 * 1) Search a customer by phone/ID in the left pane (or click a sample).
 * 2) Ask things like: "what's my balance?", "change my contact number to 98xxxxxx12",
 *    "generate a payment link for 1200", "am I eligible for a personal loan?".
 * 3) Watch the Planner break the request into Goals/Tools, and the Tools tab simulate calls.
 * 4) Open the Memory tab to see short/long-term memory being updated.
 */

/************************************* Mock Data & Utilities *************************************/
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

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }

/************************************* Mocked API Gateway (Tools) *************************************/
const ToolLatencyMs = 600; // simulate network

const ToolAPI = {
  async getLoanDetails(loanID) {
    await sleep(ToolLatencyMs);
    const loan = SAMPLE_CUSTOMERS.flatMap(c => c.loans).find(l => l.loanID === loanID);
    if (!loan) throw new Error("Loan not found");
    return { ok: true, data: loan };
  },
  async getPaymentHistory(loanID) {
    await sleep(ToolLatencyMs);
    // generate synthetic history
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
    // naive rule: if total balance < 20k then eligible
    const cust = SAMPLE_CUSTOMERS.find(c => c.id === customerID);
    const totalBal = (cust?.loans || []).reduce((s, l) => s + l.balance, 0);
    const eligible = totalBal < 20000;
    return { ok: true, data: { eligible, score: Math.max(0, 850 - totalBal / 50), product_type } };
  },
};

/************************************* Memory (Short-term / Long-term) *************************************/
const Memory = {
  load() {
    const raw = localStorage.getItem("saathi_memory_v1");
    return raw ? JSON.parse(raw) : { longTerm: [], shortTerm: [] };
  },
  save(mem) {
    localStorage.setItem("saathi_memory_v1", JSON.stringify(mem));
  },
  addShort(event) {
    const mem = Memory.load();
    mem.shortTerm.unshift({ id: uid("evt"), ts: Date.now(), ...event });
    mem.shortTerm = mem.shortTerm.slice(0, 50);
    Memory.save(mem);
    return mem;
  },
  addLong(fact) {
    const mem = Memory.load();
    mem.longTerm.unshift({ id: uid("fact"), ts: Date.now(), ...fact });
    mem.longTerm = mem.longTerm.slice(0, 200);
    Memory.save(mem);
    return mem;
  },
};

/************************************* Agent Planner & NLU (rule-based demo) *************************************/
function simpleNLU(text) {
  const t = text.toLowerCase();
  const intents = [];
  if (/balance|outstanding|due/.test(t)) intents.push({ type: "get_balance" });
  if (/payment link|pay link|link/.test(t)) intents.push({ type: "payment_link", amount: parseInt(t.match(/\b(\d{3,7})\b/)?.[1] || "0", 10) || undefined });
  if (/update|change/.test(t) && /number|phone|contact/.test(t)) intents.push({ type: "update_phone", phone: t.match(/(\+?\d{10,13})/)?.[1] });
  if (/eligib|pre-?approved|can i get/.test(t)) intents.push({ type: "check_eligibility", product: /personal|insta|tw|two/.test(t) ? "Personal Loan" : "Generic" });
  if (/history/.test(t)) intents.push({ type: "payment_history" });
  if (/help|issue|problem|complain/.test(t)) intents.push({ type: "create_ticket", description: text });
  return intents.length ? intents : [{ type: "chitchat" }];
}

function planFromIntents(intents, context) {
  // Produce a simple, auditable plan graph
  const steps = [];
  intents.forEach((intent, idx) => {
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

/************************************* Reducer & State *************************************/
const initialState = {
  customer: null,
  messages: [
    { id: uid("m"), role: "agent", text: "Hello, I am SAATHI, your personal TVS Credit AI companion. How can I help today?", meta: { tone: "warm" } }
  ],
  runningPlan: [],
  toolLogs: [],
  busy: false,
  settings: { voice: false, language: "en", confidenceThreshold: 0.4 },
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_CUSTOMER":
      return { ...state, customer: action.customer };
    case "ADD_MSG":
      return { ...state, messages: [...state.messages, action.msg] };
    case "SET_PLAN":
      return { ...state, runningPlan: action.plan };
    case "LOG_TOOL":
      return { ...state, toolLogs: [action.log, ...state.toolLogs].slice(0, 40) };
    case "SET_BUSY":
      return { ...state, busy: action.value };
    case "SET_SETTING":
      return { ...state, settings: { ...state.settings, [action.key]: action.value } };
    default:
      return state;
  }
}

/************************************* UI Components *************************************/
function MetricCard({ icon: Icon, title, value, hint }) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" />
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-2xl font-bold">{value}</div>
        {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
      </CardContent>
    </Card>
  );
}

function ToolLog({ log }) {
  return (
    <div className="p-3 rounded-xl bg-muted/40 border text-xs">
      <div className="flex items-center justify-between">
        <div className="font-medium">{log.tool}</div>
        <Badge variant={log.ok ? "default" : "destructive"}>{log.ok ? "OK" : "ERR"}</Badge>
      </div>
      <div className="mt-1 font-mono break-all">args: {JSON.stringify(log.args)}</div>
      <div className="font-mono mt-1 break-all">result: {JSON.stringify(log.result)}</div>
      <div className="text-[10px] mt-1 opacity-70">{new Date(log.ts).toLocaleString()}</div>
    </div>
  );
}

function Planner({ steps }) {
  return (
    <div className="space-y-2">
      {steps.map((s, i) => (
        <div key={s.id} className="p-3 rounded-xl border bg-card">
          <div className="flex items-center gap-2 text-sm font-medium"><Brain className="h-4 w-4"/> Step {i + 1}: {s.goal}</div>
          <div className="mt-1 text-xs text-muted-foreground">Intent: {s.intent.type}</div>
          <div className="mt-1 text-xs">{s.tool ? (<>
            <span className="font-medium">Tool:</span> {s.tool} <span className="font-medium ml-2">Args:</span> <span className="font-mono">{JSON.stringify(s.args)}</span>
          </>) : <span>Conversation-only</span>}
          </div>
        </div>
      ))}
      {!steps.length && <div className="text-sm text-muted-foreground">No active plan.</div>}
    </div>
  );
}

function MessageBubble({ role, text }) {
  const isAgent = role !== "user";
  return (
    <div className={`flex ${isAgent ? "justify-start" : "justify-end"}`}>
      <div className={`max-w-[75%] p-3 rounded-2xl ${isAgent ? "bg-muted" : "bg-primary text-primary-foreground"}`}>
        <div className="whitespace-pre-wrap leading-relaxed text-sm">{text}</div>
      </div>
    </div>
  );
}

/************************************* Main App *************************************/
export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [query, setQuery] = useState("");
  const [toolTab, setToolTab] = useState("planner");
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.messages]);

  const activeLoans = state.customer?.loans?.length || 0;
  const nextDue = state.customer?.loans?.[0]?.dueDate;

  const sendUser = async (text) => {
    const userMsg = { id: uid("m"), role: "user", text };
    dispatch({ type: "ADD_MSG", msg: userMsg });

    // NLU + Planner
    const intents = simpleNLU(text);
    const steps = planFromIntents(intents, state.customer);
    dispatch({ type: "SET_PLAN", plan: steps });
    Memory.addShort({ type: "user_msg", text });

    // Execute plan
    dispatch({ type: "SET_BUSY", value: true });

    const toolOutputs = [];

    for (const step of steps) {
      if (!step.tool) {
        // chitchat
        toolOutputs.push({ step, ok: true, result: { text: "I’m here to help with balances, payment links, updates and more." } });
        continue;
      }
      try {
        const result = await ToolAPI[step.tool](...(Object.values(step.args)));
        const log = { id: uid("log"), ts: Date.now(), tool: step.tool, args: step.args, ok: result.ok, result: result.data };
        dispatch({ type: "LOG_TOOL", log });
        Memory.addShort({ type: "tool_call", ...log });
        toolOutputs.push({ step, ...result });
      } catch (e) {
        const log = { id: uid("log"), ts: Date.now(), tool: step.tool, args: step.args, ok: false, result: { error: e.message } };
        dispatch({ type: "LOG_TOOL", log });
        toolOutputs.push(log);
      }
    }

    // Compose agent response from tool outputs
    const parts = [];
    for (const out of toolOutputs) {
      if (out.step?.intent?.type === "get_balance" && out.ok) {
        parts.push(`Your ${out.result.product} loan (${out.result.loanID}) outstanding is ₹${out.result.balance}. Next due: ${out.result.dueDate}.`);
      }
      if (out.step?.intent?.type === "payment_link" && out.ok) {
        parts.push(`Here is your secure payment link: ${out.result.url}`);
      }
      if (out.step?.intent?.type === "update_phone") {
        if (out.ok) { parts.push(`Got it. I’ve updated your contact number to ${out.step.args.value}.`); Memory.addLong({ type: "profile", field: "phone", value: out.step.args.value }); }
        else parts.push("I couldn’t update the phone right now. Connecting a human expert if you’d like.");
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
    dispatch({ type: "ADD_MSG", msg: agentMsg });
    Memory.addShort({ type: "agent_msg", text: agentMsg.text });

    dispatch({ type: "SET_BUSY", value: false });
  };

  const pickCustomer = (cust) => {
    dispatch({ type: "SET_CUSTOMER", customer: cust });
    dispatch({ type: "ADD_MSG", msg: { id: uid("m"), role: "agent", text: `Welcome ${cust.name}. How may I assist you today?` } });
    Memory.addLong({ type: "session_start", customerID: cust.id, phone: cust.phone });
  };

  const searchByPhone = (phone) => {
    const match = SAMPLE_CUSTOMERS.find(c => c.phone.endsWith(phone.slice(-4)) || c.phone === phone || c.id === phone);
    if (match) pickCustomer(match); else alert("No customer matched in demo data. Try 9876543210 or 9810012345.");
  };

  const mem = useMemo(() => Memory.load(), [state.messages, state.toolLogs, state.customer]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="mx-auto max-w-7xl grid grid-cols-12 gap-4">
        {/* Left Sidebar: Customer & Tools */}
        <div className="col-span-12 lg:col-span-3 space-y-4">
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg"><User className="h-5 w-5"/> Customer Search</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex gap-2">
                <Input placeholder="Phone / Customer ID" onKeyDown={(e) => { if (e.key === 'Enter') searchByPhone(e.currentTarget.value); }} />
                <Button onClick={() => {
                  const el = document.querySelector("input[placeholder='Phone / Customer ID']");
                  if (el) searchByPhone(el.value);
                }} variant="default" className="rounded-2xl"><Search className="h-4 w-4"/></Button>
              </div>
              <div className="text-xs text-muted-foreground">Try <code>9876543210</code> or <code>9810012345</code>, or click a sample below.</div>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_CUSTOMERS.map(c => (
                  <Button key={c.id} variant="secondary" className="rounded-2xl" onClick={() => pickCustomer(c)}>{c.name}</Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg"><Wrench className="h-5 w-5"/> Agent Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm"><Mic className="h-4 w-4"/> Voice Mode</div>
                <Switch checked={state.settings.voice} onCheckedChange={(v) => dispatch({ type: "SET_SETTING", key: "voice", value: v })} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm"><Languages className="h-4 w-4"/> Language</div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="rounded-2xl h-8 px-3 text-xs">{state.settings.language.toUpperCase()}</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="rounded-2xl">
                    {['en','hi','ta','te','kn'].map(l => (
                      <DropdownMenuItem key={l} onClick={() => dispatch({ type: "SET_SETTING", key: "language", value: l })}>{l.toUpperCase()}</DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" className="rounded-2xl" onClick={() => alert('SSO flow placeholder') }><ShieldCheck className="h-4 w-4 mr-2"/> KYC Verify</Button>
                <Button variant="secondary" className="rounded-2xl" onClick={() => alert('Doc scan placeholder')}><ScanText className="h-4 w-4 mr-2"/> Doc Scan</Button>
                <Button variant="secondary" className="rounded-2xl" onClick={() => alert('Call transfer placeholder')}><Headphones className="h-4 w-4 mr-2"/> Human Handoff</Button>
                <Button variant="secondary" className="rounded-2xl" onClick={() => alert('Telephony placeholder')}><Phone className="h-4 w-4 mr-2"/> Dial Out</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg"><Database className="h-5 w-5"/> Memory</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[300px] overflow-auto pr-1">
              <div className="text-xs font-medium">Long-term</div>
              <div className="space-y-2">
                {mem.longTerm.map(x => (
                  <div key={x.id} className="p-2 rounded-xl bg-muted/40 border">
                    <div className="text-xs">{x.type}: {x.field ? `${x.field} → ${x.value}` : JSON.stringify(x)}</div>
                    <div className="text-[10px] opacity-60">{new Date(x.ts).toLocaleString()}</div>
                  </div>
                ))}
                {!mem.longTerm.length && <div className="text-xs text-muted-foreground">No long-term items yet.</div>}
              </div>
              <Separator />
              <div className="text-xs font-medium">Short-term</div>
              <div className="space-y-2">
                {mem.shortTerm.map(x => (
                  <div key={x.id} className="p-2 rounded-xl bg-muted/40 border">
                    <div className="text-xs truncate">{x.type}: {x.text || x.tool}</div>
                    <div className="text-[10px] opacity-60">{new Date(x.ts).toLocaleString()}</div>
                  </div>
                ))}
                {!mem.shortTerm.length && <div className="text-xs text-muted-foreground">No short-term items yet.</div>}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Center: Chat + KPIs */}
        <div className="col-span-12 lg:col-span-6 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <MetricCard icon={MessageCircle} title="CSAT (demo)" value="4.7/5" hint="last 30d" />
            <MetricCard icon={Zap} title="First Contact Resolution" value="78%" hint="target 85%" />
            <MetricCard icon={CreditCard} title="On-time EMI" value="92%" hint="proactive nudges" />
          </div>

          <Card className="rounded-2xl shadow-sm h-[520px] flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bot className="h-5 w-5"/> TVS SAATHI — Agentic Chat
                {state.customer && <Badge variant="secondary" className="ml-2 rounded-2xl">{state.customer.name}</Badge>}
                {activeLoans > 0 && <Badge className="ml-2 rounded-2xl" variant="outline">{activeLoans} Loan(s)</Badge>}
                {nextDue && <Badge className="ml-2 rounded-2xl" variant="outline">Next due: {nextDue}</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto space-y-3 pr-2">
              {state.messages.map(m => <MessageBubble key={m.id} role={m.role} text={m.text} />)}
              <div ref={scrollRef} />
            </CardContent>
            <div className="p-3 border-t">
              <div className="flex items-center gap-2">
                <Input
                  placeholder={state.customer ? "Type a request… (e.g., what's my balance?)" : "Select a customer first"}
                  disabled={!state.customer || state.busy}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && query.trim()) { sendUser(query.trim()); setQuery(""); } }}
                />
                <Button disabled={!state.customer || state.busy || !query.trim()} onClick={() => { sendUser(query.trim()); setQuery(""); }} className="rounded-2xl">
                  {state.busy ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4"/>}
                </Button>
              </div>
              <div className="text-[11px] mt-2 text-muted-foreground flex items-center gap-2"><ShieldCheck className="h-3 w-3"/> For demo: data is synthetic; tools are mocked via secure gateway abstraction.</div>
            </div>
          </Card>
        </div>

        {/* Right Side: Planner / Tools / Observability */}
        <div className="col-span-12 lg:col-span-3 space-y-4">
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg"><Brain className="h-5 w-5"/> Planner & Tools</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={toolTab} onValueChange={setToolTab}>
                <TabsList className="grid grid-cols-3 w-full rounded-2xl">
                  <TabsTrigger value="planner">Plan</TabsTrigger>
                  <TabsTrigger value="tools">Tools</TabsTrigger>
                  <TabsTrigger value="logs">Logs</TabsTrigger>
                </TabsList>
                <TabsContent value="planner" className="mt-3">
                  <Planner steps={state.runningPlan} />
                </TabsContent>
                <TabsContent value="tools" className="mt-3 space-y-2">
                  <div className="grid grid-cols-1 gap-2">
                    <Button variant="outline" className="justify-start rounded-2xl" onClick={async () => {
                      if (!state.customer) return alert('Pick a customer first');
                      const loanID = state.customer.loans?.[0]?.loanID;
                      dispatch({ type: "SET_PLAN", plan: [{ id: uid('s'), goal: 'Manual balance fetch', tool: 'getLoanDetails', args: { loanID }, intent: { type: 'get_balance' } }] });
                      const r = await ToolAPI.getLoanDetails(loanID);
                      const log = { id: uid("log"), ts: Date.now(), tool: 'getLoanDetails', args: { loanID }, ok: r.ok, result: r.data };
                      dispatch({ type: "LOG_TOOL", log });
                      dispatch({ type: "ADD_MSG", msg: { id: uid('m'), role: 'agent', text: `Balance for ${loanID}: ₹${r.data.balance}` } });
                    }}><Database className="h-4 w-4 mr-2"/> getLoanDetails()</Button>
                    <Button variant="outline" className="justify-start rounded-2xl" onClick={async () => {
                      if (!state.customer) return alert('Pick a customer first');
                      const loanID = state.customer.loans?.[0]?.loanID;
                      const r = await ToolAPI.getPaymentHistory(loanID);
                      const log = { id: uid("log"), ts: Date.now(), tool: 'getPaymentHistory', args: { loanID }, ok: r.ok, result: r.data };
                      dispatch({ type: "LOG_TOOL", log });
                      dispatch({ type: "ADD_MSG", msg: { id: uid('m'), role: 'agent', text: `Pulled ${r.data.length} history items for ${loanID}.` } });
                    }}><History className="h-4 w-4 mr-2"/> getPaymentHistory()</Button>
                    <Button variant="outline" className="justify-start rounded-2xl" onClick={async () => {
                      if (!state.customer) return alert('Pick a customer first');
                      const loanID = state.customer.loans?.[0]?.loanID; const amount = 1200;
                      const r = await ToolAPI.generatePaymentLink(loanID, amount);
                      const log = { id: uid("log"), ts: Date.now(), tool: 'generatePaymentLink', args: { loanID, amount }, ok: r.ok, result: r.data };
                      dispatch({ type: "LOG_TOOL", log });
                      dispatch({ type: "ADD_MSG", msg: { id: uid('m'), role: 'agent', text: `Payment link generated: ${r.data.url}` } });
                    }}><LinkIcon className="h-4 w-4 mr-2"/> generatePaymentLink()</Button>
                    <Button variant="outline" className="justify-start rounded-2xl" onClick={async () => {
                      if (!state.customer) return alert('Pick a customer first');
                      const r = await ToolAPI.updateCustomerInfo(state.customer.id, 'language', state.settings.language);
                      const log = { id: uid("log"), ts: Date.now(), tool: 'updateCustomerInfo', args: { customerID: state.customer.id, field: 'language', value: state.settings.language }, ok: r.ok, result: r.data };
                      dispatch({ type: "LOG_TOOL", log });
                      dispatch({ type: "ADD_MSG", msg: { id: uid('m'), role: 'agent', text: `Preferred language updated to ${state.settings.language.toUpperCase()}.` } });
                    }}><Languages className="h-4 w-4 mr-2"/> updateCustomerInfo()</Button>
                    <Button variant="outline" className="justify-start rounded-2xl" onClick={async () => {
                      if (!state.customer) return alert('Pick a customer first');
                      const r = await ToolAPI.createServiceTicket(state.customer.id, 'General assistance requested');
                      const log = { id: uid("log"), ts: Date.now(), tool: 'createServiceTicket', args: { customerID: state.customer.id, issue_description: 'General assistance requested' }, ok: r.ok, result: r.data };
                      dispatch({ type: "LOG_TOOL", log });
                      dispatch({ type: "ADD_MSG", msg: { id: uid('m'), role: 'agent', text: `Ticket created: ${r.data.id}` } });
                    }}><FileText className="h-4 w-4 mr-2"/> createServiceTicket()</Button>
                    <Button variant="outline" className="justify-start rounded-2xl" onClick={async () => {
                      if (!state.customer) return alert('Pick a customer first');
                      const r = await ToolAPI.checkEligibility(state.customer.id, 'Personal Loan');
                      const log = { id: uid("log"), ts: Date.now(), tool: 'checkEligibility', args: { customerID: state.customer.id, product_type: 'Personal Loan' }, ok: r.ok, result: r.data };
                      dispatch({ type: "LOG_TOOL", log });
                      dispatch({ type: "ADD_MSG", msg: { id: uid('m'), role: 'agent', text: r.data.eligible ? `Eligible. Indicative score ${Math.round(r.data.score)}.` : `Not eligible right now.` } });
                    }}><Sparkles className="h-4 w-4 mr-2"/> checkEligibility()</Button>
                  </div>
                </TabsContent>
                <TabsContent value="logs" className="mt-3 space-y-2 max-h-[320px] overflow-auto pr-1">
                  {state.toolLogs.map(log => <ToolLog key={log.id} log={log} />)}
                  {!state.toolLogs.length && <div className="text-sm text-muted-foreground">No tool calls yet.</div>}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg"><Wand2 className="h-5 w-5"/> Implementation Phases</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              <div className="p-3 rounded-xl border bg-muted/30">
                <div className="font-medium">Phase 1 — The Listener</div>
                <div className="text-muted-foreground">WhatsApp read-only assistant for Two-Wheeler loans. Intent → KB → Answers. (This prototype covers conversational core + memory.)</div>
              </div>
              <div className="p-3 rounded-xl border bg-muted/30">
                <div className="font-medium">Phase 2 — The Helper</div>
                <div className="text-muted-foreground">Add voice (STT/TTS), enable transactional tools (links, profile updates). (Demonstrated via mocked tools.)</div>
              </div>
              <div className="p-3 rounded-xl border bg-muted/30">
                <div className="font-medium">Phase 3 — Proactive</div>
                <div className="text-muted-foreground">Outbound nudges, reminders, and intelligent cross-sell. (Scaffolded via eligibility checks.)</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer / Credits */}
      <div className="mt-4 text-center text-xs text-muted-foreground">
        Official Submission: TVS SAATHI — A Strategic & Technical Blueprint · Project Lead: Padmnabh Tewari · {new Date().toLocaleDateString()}
      </div>
    </div>
  );
}
