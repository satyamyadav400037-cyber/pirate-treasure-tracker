import { startLogin } from "@/const";
import TreasureMap from "@/components/TreasureMap";
import Ocean3DBackground from "@/components/Ocean3DBackground";
import {
  CaptainsRosterModal, ClueDecoderModal, CommodityExchangeCard, PirateSoundDeck,
  BountyBoardModal, PirateCodeModal, TavernRumEconomyModal, AchievementsModal,
  FleetProjectionsCard, JollyRogerBuilderModal, LogbookEditorModal
} from "@/components/PirateDeckComponents";
import { useAuth } from "@/_core/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { trpc } from "@/lib/trpc";
import type { AppRouter } from "../../../server/routers";
import type { inferRouterOutputs } from "@trpc/server";
import {
  Anchor, BarChart3, Bell, Check, ChevronDown, Coins, Compass, Download, Edit3, Gem, Grid2X2, HelpCircle, Landmark, LayoutDashboard, LogOut, Map as MapIcon, Menu, Moon, MoreHorizontal, Navigation, PanelLeft, Pickaxe, Plus, Search, Settings, Shield, ShieldCheck, Skull, Sparkles, Sun, Target, Trash2, TrendingUp, Waves, X, ZoomIn,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type Treasure = inferRouterOutputs<AppRouter>["treasures"]["list"][number];
type Status = Treasure["status"];

type FormState = {
  name: string;
  islandName: string;
  latitude: string;
  longitude: string;
  value: string;
  terrain: string;
  burialDepth: string;
  status: Status;
};

const blankForm: FormState = { name: "", islandName: "", latitude: "15.4200", longitude: "-66.1000", value: "150000", terrain: "Coastal", burialDepth: "10", status: "Found" };
const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "treasures", label: "Treasures", icon: Gem },
  { id: "map", label: "Map", icon: MapIcon },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
] as const;

const money = (value: number) => new Intl.NumberFormat("en-US").format(value);
const dateLabel = (value: Date | string | number) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
const statusLabel: Record<Status, string> = { Found: "Found", Lost: "Lost", Stolen: "Stolen" };

function StatusBadge({ status }: { status: Status }) {
  return <span className={`status-badge ${status.toLowerCase()}`}><i />{statusLabel[status]}</span>;
}

function MetricCard({ icon: Icon, label, value, note, tone }: { icon: typeof Gem; label: string; value: string; note: string; tone: string }) {
  return <article className={`metric-card ${tone}`}>
    <div className="metric-icon"><Icon size={23} strokeWidth={1.8} /></div>
    <div className="metric-copy"><span>{label}</span><strong>{value}</strong><small>{note}</small></div>
    <div className="metric-spark"><span /><span /><span /><span /><span /></div>
  </article>;
}

function SectionTitle({ eyebrow, title, sub, icon: Icon }: { eyebrow?: string; title: string; sub?: string; icon?: typeof Gem }) {
  return <div className="section-title">{Icon && <div className="title-icon"><Icon size={20} /></div>}<div><div className="eyebrow">{eyebrow ?? "THE CAPTAIN'S LEDGER"}</div><h2>{title}</h2>{sub && <p>{sub}</p>}</div></div>;
}

function TreasureForm({ form, setForm, editing, onSubmit, onClose, submitting, onMapPick }: { form: FormState; setForm: React.Dispatch<React.SetStateAction<FormState>>; editing: Treasure | null; onSubmit: (event: React.FormEvent) => void; onClose: () => void; submitting: boolean; onMapPick: (lat: number, lng: number) => void }) {
  const field = (key: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((current) => ({ ...current, [key]: event.target.value }));
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <form className="treasure-modal" onSubmit={onSubmit}>
      <div className="modal-head"><div><span className="eyebrow">{editing ? "EDIT LEDGER ENTRY" : "NEW LEDGER ENTRY"}</span><h2>{editing ? "Refine the record" : "Log a new treasure"}</h2></div><button className="icon-button" type="button" onClick={onClose} aria-label="Close"><X size={18} /></button></div>
      <div className="form-grid">
        <label className="field full"><span>Treasure name</span><input value={form.name} onChange={field("name")} placeholder="e.g. The Sunken Crown" required /></label>
        <label className="field"><span>Island / location</span><input value={form.islandName} onChange={field("islandName")} placeholder="e.g. Skull Island" required /></label>
        <label className="field"><span>Terrain</span><select value={form.terrain} onChange={field("terrain")}><option>Coastal</option><option>Jungle</option><option>Reef</option><option>Ruins</option><option>Cave</option><option>Atoll</option><option>Volcanic</option><option>Cove</option></select></label>
        <label className="field"><span>Estimated value <em>gold doubloons</em></span><input type="number" min="0" value={form.value} onChange={field("value")} placeholder="250000" /></label>
        <label className="field"><span>Burial depth <em>meters</em></span><input type="number" min="0" step="0.1" value={form.burialDepth} onChange={field("burialDepth")} placeholder="12" /></label>
        <label className="field"><span>Status</span><select value={form.status} onChange={field("status")}><option>Found</option><option>Lost</option><option>Stolen</option></select></label>
        <div className="field"><span>Coordinates <em>click the map to place a pin</em></span><div className="coordinate-row"><input type="number" min="-90" max="90" step="0.0001" value={form.latitude} onChange={field("latitude")} placeholder="Latitude" /><input type="number" min="-180" max="180" step="0.0001" value={form.longitude} onChange={field("longitude")} placeholder="Longitude" /></div><small className="coordinate-help"><Target size={13} /> Real nautical ranges: lat −90 to 90 · long −180 to 180</small></div>
      </div>
      <div className="modal-foot"><span><Shield size={14} /> Every status transition is timestamped</span><div><button type="button" className="button ghost" onClick={onClose}>Cancel</button><button type="submit" className="button gold">{editing ? "Update treasure" : "Save treasure"}</button></div></div>
    </form>
  </div>;
}

function HistoryModal({ treasure, onClose }: { treasure: Treasure; onClose: () => void }) {
  const { data: history = [], isLoading } = trpc.treasures.history.useQuery({ id: treasure.id });
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div className="history-modal"><div className="modal-head"><div><span className="eyebrow">CAPTAIN'S LOG</span><h2>{treasure.name}</h2><p>{treasure.islandName} · {money(treasure.value)} doubloons</p></div><button className="icon-button" onClick={onClose} aria-label="Close"><X size={18} /></button></div>{isLoading ? <div className="loading-line">Retrieving the log…</div> : <div className="history-list">{history.map((entry, index) => <div className="history-item" key={entry.id}><div className={`history-dot ${entry.status.toLowerCase()}`}><Check size={12} /></div><div><strong>Marked as {entry.status}</strong><span>{dateLabel(entry.changedAt)} · log entry {index + 1}</span></div></div>)}</div>}</div></div>;
}

import LoadingGate from "@/components/LoadingGate";

export default function Home() {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [loadingGate, setLoadingGate] = useState(true);
  const [activeSection, setActiveSection] = useState<(typeof navItems)[number]["id"]>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Treasure | null>(null);
  const [trackedTreasure, setTrackedTreasure] = useState<Treasure | null>(null);
  const [historyTreasure, setHistoryTreasure] = useState<Treasure | null>(null);
  const [form, setForm] = useState<FormState>(blankForm);
  const [query, setQuery] = useState("");
  const [islandFilter, setIslandFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("updated");
  const [notice, setNotice] = useState("All hands accounted for");
const DEFAULT_SEED_TREASURES: Treasure[] = [
  { id: 1, name: "Emerald Crown", islandName: "Skull Island", latitude: 18.42, longitude: -66.08, value: 250000, terrain: "Jungle", burialDepth: 12, status: "Found", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 2, name: "Ruby Chalice", islandName: "Cursed Reef", latitude: 14.61, longitude: -61.03, value: 175000, terrain: "Reef", burialDepth: 8, status: "Lost", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 3, name: "Aztec Idol", islandName: "Jaguar Key", latitude: 12.18, longitude: -68.25, value: 300000, terrain: "Cave", burialDepth: 20, status: "Stolen", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 4, name: "Golden Compass", islandName: "Whisper Island", latitude: 21.5, longitude: -77.78, value: 120000, terrain: "Cave", burialDepth: 5, status: "Found", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 5, name: "Sapphire Chest", islandName: "Shadow Atoll", latitude: 10.4, longitude: -76.54, value: 200000, terrain: "Coastal", burialDepth: 15, status: "Found", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 6, name: "Black Pearl Cache", islandName: "Midnight Isle", latitude: 16.75, longitude: -82.1, value: 95000, terrain: "Coastal", burialDepth: 10, status: "Lost", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 7, name: "Royal Doubloons", islandName: "Sunken Cay", latitude: 8.14, longitude: -81.3, value: 180000, terrain: "Coastal", burialDepth: 18, status: "Stolen", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 8, name: "Dragon Relic", islandName: "Inferno Island", latitude: 9.72, longitude: -79.42, value: 220000, terrain: "Mountain", burialDepth: 25, status: "Found", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 9, name: "Malabar Sovereign Gold", islandName: "Malabar Coast (Kerala, India)", latitude: 10.85, longitude: 75.95, value: 450000, terrain: "Coastal", burialDepth: 14, status: "Found", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 10, name: "Ceylon Star Ruby", islandName: "Galle Fort (Sri Lanka)", latitude: 6.03, longitude: 80.21, value: 520000, terrain: "Reef", burialDepth: 9, status: "Lost", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 11, name: "Lakshadweep Emerald Isle", islandName: "Kavaratti Atoll (India)", latitude: 10.57, longitude: 72.64, value: 380000, terrain: "Coastal", burialDepth: 11, status: "Found", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 12, name: "Andaman Cursed Sapphire", islandName: "Port Blair (Andaman, India)", latitude: 11.62, longitude: 92.72, value: 600000, terrain: "Jungle", burialDepth: 22, status: "Stolen", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 13, name: "Trincomalee Galleon Cache", islandName: "Trincomalee Bay (Sri Lanka)", latitude: 8.58, longitude: 81.21, value: 340000, terrain: "Coastal", burialDepth: 16, status: "Found", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 14, name: "Coromandel Jewel Chest", islandName: "Pulicat Lagoon (Tamil Nadu, India)", latitude: 13.41, longitude: 80.31, value: 290000, terrain: "Cave", burialDepth: 18, status: "Lost", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 15, name: "Goa Portuguese Doubloons", islandName: "Mormugao Bay (Goa, India)", latitude: 15.4, longitude: 73.8, value: 410000, terrain: "Coastal", burialDepth: 10, status: "Found", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

  const [localTreasures, setLocalTreasures] = useState<Treasure[]>(() => {
    try {
      const saved = localStorage.getItem("pirate_local_treasures");
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_SEED_TREASURES;
  });

  const utils = trpc.useUtils();
  const { data: serverTreasures } = trpc.treasures.list.useQuery(undefined, { retry: false });
  const { data: stats } = trpc.treasures.stats.useQuery(undefined, { retry: false });

  const treasures = useMemo(() => {
    return (serverTreasures && serverTreasures.length > 0) ? serverTreasures : localTreasures;
  }, [serverTreasures, localTreasures]);

  const saveLocal = (next: Treasure[]) => {
    setLocalTreasures(next);
    try {
      localStorage.setItem("pirate_local_treasures", JSON.stringify(next));
    } catch {}
  };

  const createMutation = trpc.treasures.create.useMutation({ onSuccess: async () => { await Promise.all([utils.treasures.list.invalidate(), utils.treasures.stats.invalidate()]); } });
  const updateMutation = trpc.treasures.update.useMutation({ onSuccess: async () => { await Promise.all([utils.treasures.list.invalidate(), utils.treasures.stats.invalidate()]); } });
  const removeMutation = trpc.treasures.remove.useMutation({ onSuccess: async () => { await Promise.all([utils.treasures.list.invalidate(), utils.treasures.stats.invalidate()]); } });

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [activityModalOpen, setActivityModalOpen] = useState(false);

  const islands = useMemo(() => Array.from(new Set(treasures.map((treasure) => treasure.islandName))).sort(), [treasures]);
  const filteredTreasures = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    return treasures.filter((treasure) => (!normalized || `${treasure.name} ${treasure.islandName}`.toLowerCase().includes(normalized)) && (islandFilter === "all" || treasure.islandName === islandFilter) && (statusFilter === "all" || treasure.status === statusFilter)).sort((a, b) => sortBy === "value" ? b.value - a.value : sortBy === "name" ? a.name.localeCompare(b.name) : sortBy === "status" ? a.status.localeCompare(b.status) : new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [treasures, query, islandFilter, statusFilter, sortBy]);

  useEffect(() => {
    setPage(1);
  }, [query, islandFilter, statusFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredTreasures.length / pageSize));
  const visibleTreasures = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredTreasures.slice(start, start + pageSize);
  }, [filteredTreasures, page, pageSize]);

  const currentStats = stats ?? { total: treasures.length, totalValue: treasures.reduce((sum, treasure) => sum + treasure.value, 0), counts: { Found: treasures.filter((t) => t.status === "Found").length, Lost: treasures.filter((t) => t.status === "Lost").length, Stolen: treasures.filter((t) => t.status === "Stolen").length }, mostValuableIsland: null, recentActivity: [] };

  function closeForm() { setFormOpen(false); setEditing(null); setForm(blankForm); }
  function openCreate() { setEditing(null); setForm(blankForm); setFormOpen(true); }
  function openEdit(treasure: Treasure) { setEditing(treasure); setForm({ name: treasure.name, islandName: treasure.islandName, latitude: String(treasure.latitude), longitude: String(treasure.longitude), value: String(treasure.value), terrain: treasure.terrain ?? "Coastal", burialDepth: String(treasure.burialDepth ?? 0), status: treasure.status }); setFormOpen(true); }
  
  function submitForm(event: React.FormEvent) {
    event.preventDefault();
    const payload = { name: form.name.trim(), islandName: form.islandName.trim(), latitude: Number(form.latitude), longitude: Number(form.longitude), value: Number(form.value), terrain: form.terrain, burialDepth: Number(form.burialDepth), status: form.status };
    if (![payload.latitude, payload.longitude, payload.value, payload.burialDepth].every(Number.isFinite)) {
      toast.error("Check the numeric coordinates and value");
      return;
    }
    const newEntry: Treasure = {
      id: editing ? editing.id : (localTreasures.length ? Math.max(...localTreasures.map((t) => t.id)) + 1 : Date.now()),
      ...payload,
      createdAt: editing ? editing.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (editing) {
      saveLocal(localTreasures.map((t) => (t.id === editing.id ? newEntry : t)));
      toast.success("Ledger entry updated");
      try { updateMutation.mutate({ id: editing.id, ...payload }); } catch {}
    } else {
      saveLocal([newEntry, ...localTreasures]);
      toast.success("Treasure added to the ledger");
      try { createMutation.mutate(payload); } catch {}
    }
    closeForm();
  }

  function removeTreasure(treasure: Treasure) {
    if (window.confirm(`Remove ${treasure.name} from the ledger? This cannot be undone.`)) {
      saveLocal(localTreasures.filter((t) => t.id !== treasure.id));
      toast.success("Treasure removed from the ledger");
      setTrackedTreasure(null);
      setHistoryTreasure(null);
      try { removeMutation.mutate({ id: treasure.id }); } catch {}
    }
  }
  function handleMapPick(lat: number, lng: number) { setForm((current) => ({ ...current, latitude: lat.toFixed(4), longitude: lng.toFixed(4) })); setFormOpen(true); toast("Coordinates plotted from the map", { icon: "⚓" }); }
  const mapPick = useCallback((lat: number, lng: number) => handleMapPick(lat, lng), []);

  const handleTrackVoyage = useCallback((treasure: Treasure) => {
    setTrackedTreasure(treasure);
    setActiveSection("map");
    toast.success(`Tracking voyage route to ${treasure.name}`);
  }, []);

  const handleMapSelect = useCallback((treasure: { id: number } | null) => {
    if (!treasure) {
      setTrackedTreasure(null);
      return;
    }
    const found = treasures.find((entry) => entry.id === treasure.id) ?? null;
    setTrackedTreasure(found);
  }, [treasures]);

  const [captainsOpen, setCaptainsOpen] = useState(false);
  const [clueDecoderOpen, setClueDecoderOpen] = useState(false);
  const [bountyBoardOpen, setBountyBoardOpen] = useState(false);
  const [pirateCodeOpen, setPirateCodeOpen] = useState(false);
  const [rumEconomyOpen, setRumEconomyOpen] = useState(false);
  const [achievementsOpen, setAchievementsOpen] = useState(false);
  const [jollyRogerOpen, setJollyRogerOpen] = useState(false);
  const [logbookOpen, setLogbookOpen] = useState(false);

  useEffect(() => { const onKey = (event: KeyboardEvent) => { if (event.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") { event.preventDefault(); document.getElementById("treasure-search")?.focus(); } }; window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey); }, []);
  useEffect(() => { const timer = window.setTimeout(() => setNotice("All hands accounted for"), 3500); return () => window.clearTimeout(timer); }, [notice]);

  const setSection = (section: (typeof navItems)[number]["id"]) => { setActiveSection(section); setSidebarOpen(false); };
  const exportCsv = async () => { const csv = await utils.treasures.exportCsv.fetch(); const blob = new Blob([csv], { type: "text/csv;charset=utf-8" }); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "pirate-treasure-ledger.csv"; anchor.click(); URL.revokeObjectURL(url); toast.success("Ledger exported as CSV"); };

  return <div className="app-shell">
    {loadingGate && <LoadingGate onFinish={() => setLoadingGate(false)} />}
    <Ocean3DBackground />
    <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
      <div className="brand"><div className="brand-mark"><Skull size={27} /></div><div><strong>PIRATE</strong><span>TREASURE TRACKER</span></div></div>
      <div className="brand-rule" />
      <div className="tagline">Discover <b>•</b> Track <b>•</b> Conquer</div>
      <nav className="sidebar-nav">{navItems.map(({ id, label, icon: Icon }) => <button key={id} className={activeSection === id ? "active" : ""} onClick={() => setSection(id)}><Icon size={19} /><span>{label}</span>{id === "treasures" && <em>{currentStats.total}</em>}</button>)}</nav>
      <div className="sidebar-quote"><span>“Not all treasure is silver and gold. Some is freedom.”</span><small>— Captain Blackbeard</small></div>
      <div className="sidebar-ship-card"><img src="/pirate-sidebar.jpg" alt="Skull Island Haven" className="sidebar-art-img" /><div className="sidebar-art-caption"><Compass size={12} /><span>Skull Island Haven</span></div></div>
      <div className="sidebar-footer"><span>Sail</span><b>•</b><span>Explore</span><b>•</b><span>Record</span><b>•</b><span>Rule</span></div>
    </aside>
    {sidebarOpen && <button className="mobile-scrim" onClick={() => setSidebarOpen(false)} aria-label="Close navigation" />}
    <main className="main-canvas">
      <header className="topbar"><button className="mobile-menu icon-button" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><Menu size={21} /></button><div className="breadcrumb"><span className="eyebrow">COMMAND DECK</span><b>/</b><strong>{navItems.find((item) => item.id === activeSection)?.label}</strong></div><div className="topbar-actions"><div className="global-search"><Search size={17} /><input id="treasure-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search treasures, islands..." /><kbd>/</kbd></div><div className="notification-wrap"><button className="notification-button icon-button" aria-label="Notifications" aria-expanded={notificationsOpen} onClick={() => { setNotificationsOpen((value) => !value); setNotificationsRead(true); }}><Bell size={19} />{!notificationsRead && <i />}</button>{notificationsOpen && <div className="notification-popover"><div className="notification-popover-head"><div><span className="eyebrow">SHIP'S MESSAGES</span><strong>Notifications</strong></div><button onClick={() => setNotificationsOpen(false)} aria-label="Close notifications"><X size={14} /></button></div>{currentStats.recentActivity.length ? currentStats.recentActivity.map((activity) => <button className="notification-item" key={activity.id} onClick={() => { const found = treasures.find((t) => t.id === activity.id); if (found) handleTrackVoyage(found); setNotificationsOpen(false); }}><span className={`notification-dot ${activity.status.toLowerCase()}`} /><span><strong>{activity.name}</strong><small>{activity.status} · {dateLabel(activity.updatedAt)}</small></span></button>) : <div className="notification-empty"><Bell size={17} />No new messages from the fleet.</div>}</div>}</div><div className="profile-menu">{isAuthenticated ? <><div className="avatar">{(user?.name ?? "C").slice(0, 1).toUpperCase()}</div><div className="profile-copy"><strong>{user?.name ?? "Captain Blackbeard"}</strong><span>Keep Sailing...</span></div><ChevronDown size={14} /></> : <button className="login-button" onClick={() => startLogin()}>Sign in <Navigation size={14} /></button>}</div></div></header>
      <section className="hero-strip"><div className="hero-copy"><span className="eyebrow">THE CAPTAIN'S CHART</span><h1>Chart the Past. <em>Claim the Future.</em></h1><p>Captain Blackbeard has hidden treasure across the archipelago. Track it all and become legend.</p></div><div className="hero-compass"><Compass size={34} /><span>CURSE OF THE<br />SEVEN SEAS</span></div></section>

      {/* 🏴‍☠️ Pirate Command Deck Toolbar */}
      <div style={{ display: "flex", gap: "8px", overflowX: "auto", padding: "10px 16px", background: "rgba(12, 37, 46, 0.75)", borderBottom: "1px solid rgba(243, 198, 107, 0.25)", alignItems: "center" }}>
        <strong style={{ color: "#f3c66b", fontSize: "11px", whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: "1px" }}>🏴‍☠️ Pirate Deck Tools:</strong>
        <button className="button ghost compact" onClick={() => setCaptainsOpen(true)}>🏴‍☠️ Captains</button>
        <button className="button ghost compact" onClick={() => setClueDecoderOpen(true)}>📜 Clue Cipher</button>
        <button className="button ghost compact" onClick={() => setBountyBoardOpen(true)}>🎯 Bounties</button>
        <button className="button ghost compact" onClick={() => setRumEconomyOpen(true)}>🍻 Rum Trade</button>
        <button className="button ghost compact" onClick={() => setPirateCodeOpen(true)}>📜 Pirate Code</button>
        <button className="button ghost compact" onClick={() => setAchievementsOpen(true)}>🏆 Trophies</button>
        <button className="button ghost compact" onClick={() => setJollyRogerOpen(true)}>🏴‍☠️ Flag Builder</button>
        <button className="button ghost compact" onClick={() => setLogbookOpen(true)}>📓 Logbook</button>
        <PirateSoundDeck />
      </div>

      {activeSection === "dashboard" && <>
        <div className="metric-grid"><MetricCard icon={Gem} label="Total treasures" value={String(currentStats.total)} note="↑ 12% this season" tone="teal" /><MetricCard icon={Landmark} label="Found" value={String(currentStats.counts.Found)} note="↑ 50% recovered" tone="green" /><MetricCard icon={Skull} label="Lost" value={String(currentStats.counts.Lost)} note="● 29% of ledger" tone="red" /><MetricCard icon={Anchor} label="Stolen" value={String(currentStats.counts.Stolen)} note="↑ 21% flagged" tone="amber" /><article className="value-card"><span>Total estimated value</span><strong>{money(currentStats.totalValue)}</strong><small>Gold doubloons</small><Gem size={35} /></article></div>
        <div className="dashboard-grid"><section className="ledger-card panel"><div className="panel-head"><SectionTitle title="Treasure Ledger" sub="Manage your treasures, update their status, and keep the legend alive." icon={Gem} /><button className="button gold" onClick={openCreate}><Plus size={17} /> Add treasure</button></div><LedgerToolbar query={query} setQuery={setQuery} islands={islands} islandFilter={islandFilter} setIslandFilter={setIslandFilter} statusFilter={statusFilter} setStatusFilter={setStatusFilter} sortBy={sortBy} setSortBy={setSortBy} /><LedgerTable treasures={visibleTreasures} allCount={filteredTreasures.length} page={page} pageSize={pageSize} totalPages={totalPages} onPageChange={setPage} onPageSizeChange={setPageSize} loading={isLoading} onEdit={openEdit} onDelete={removeTreasure} onHistory={setHistoryTreasure} onTrack={handleTrackVoyage} /></section><section className="map-card panel"><div className="panel-head compact"><SectionTitle title="Island Map" sub="Explore the archipelago and discover treasure locations." icon={MapIcon} /><button className="icon-button" aria-label="Expand map" onClick={() => setSection("map")}><ZoomIn size={17} /></button></div><div className="map-wrap"><TreasureMap treasures={filteredTreasures} selectedTreasure={trackedTreasure} onSelect={handleMapSelect} onPick={mapPick} onEdit={openEdit} /><div className="map-legend"><span><i className="found" /> Found</span><span><i className="lost" /> Lost</span><span><i className="stolen" /> Stolen</span></div></div></section></div>
        <div className="bottom-grid"><QuickActions onAdd={openCreate} onMap={() => setSection("map")} onAnalytics={() => setSection("analytics")} /><RecentActivity stats={currentStats} onTrack={handleTrackVoyage} onViewAll={() => setActivityModalOpen(true)} /></div>
      </>}

      {activeSection === "treasures" && <section className="single-view panel"><div className="panel-head"><SectionTitle eyebrow="FULL INVENTORY" title="Treasure Ledger" sub="Every cache, clue, and cursed artifact in one place." icon={Gem} /><div className="button-row"><button className="button ghost" onClick={exportCsv}><Download size={16} /> Export CSV</button><button className="button gold" onClick={openCreate}><Plus size={17} /> Add treasure</button></div></div><LedgerToolbar query={query} setQuery={setQuery} islands={islands} islandFilter={islandFilter} setIslandFilter={setIslandFilter} statusFilter={statusFilter} setStatusFilter={setStatusFilter} sortBy={sortBy} setSortBy={setSortBy} /><LedgerTable treasures={visibleTreasures} allCount={filteredTreasures.length} page={page} pageSize={pageSize} totalPages={totalPages} onPageChange={setPage} onPageSizeChange={setPageSize} loading={isLoading} onEdit={openEdit} onDelete={removeTreasure} onHistory={setHistoryTreasure} onTrack={handleTrackVoyage} /></section>}
      {activeSection === "map" && <section className="map-view"><div className="view-intro"><SectionTitle eyebrow="THE GRAND CHART" title="Island Map" sub="Click anywhere on the nautical chart to start plotting a new cache." icon={Compass} /><div className="map-stats"><span><b>{currentStats.total}</b> plotted caches</span><span><b>{islands.length}</b> known islands</span></div></div><div className="large-map panel"><TreasureMap treasures={filteredTreasures} selectedTreasure={trackedTreasure} onSelect={handleMapSelect} onPick={mapPick} onEdit={openEdit} /><div className="map-legend"><span><i className="found" /> Found</span><span><i className="lost" /> Lost</span><span><i className="stolen" /> Stolen</span></div></div></section>}
      {activeSection === "analytics" && <AnalyticsView treasures={treasures} stats={currentStats} />}
      {activeSection === "settings" && <SettingsView user={user} isAuthenticated={isAuthenticated} onLogout={logout} theme={theme} toggleTheme={toggleTheme} />}

      <footer className="app-footer"><span>© 1724 Blackbeard's Cartography Guild</span><span><Waves size={14} /> Data persists across every voyage</span><span>v1.0.0 <span className="live-dot" /> Ledger online</span></footer>
    </main>
    {formOpen && <TreasureForm form={form} setForm={setForm} editing={editing} onSubmit={submitForm} onClose={closeForm} submitting={createMutation.isPending || updateMutation.isPending} onMapPick={handleMapPick} />}
    {historyTreasure && <HistoryModal treasure={historyTreasure} onClose={() => setHistoryTreasure(null)} />}
    {activityModalOpen && <ActivityModal stats={currentStats} onClose={() => setActivityModalOpen(false)} onTrack={handleTrackVoyage} />}

    {/* 🏴‍☠️ Pirate Deck Interactive Modals */}
    <CaptainsRosterModal isOpen={captainsOpen} onClose={() => setCaptainsOpen(false)} />
    <ClueDecoderModal isOpen={clueDecoderOpen} onClose={() => setClueDecoderOpen(false)} />
    <BountyBoardModal isOpen={bountyBoardOpen} onClose={() => setBountyBoardOpen(false)} />
    <PirateCodeModal isOpen={pirateCodeOpen} onClose={() => setPirateCodeOpen(false)} />
    <TavernRumEconomyModal isOpen={rumEconomyOpen} onClose={() => setRumEconomyOpen(false)} />
    <AchievementsModal isOpen={achievementsOpen} onClose={() => setAchievementsOpen(false)} />
    <JollyRogerBuilderModal isOpen={jollyRogerOpen} onClose={() => setJollyRogerOpen(false)} />
    <LogbookEditorModal isOpen={logbookOpen} onClose={() => setLogbookOpen(false)} />
    <div className="toast-ribbon"><span className="live-dot" /> {notice}</div>
  </div>;
}

function LedgerToolbar({ query, setQuery, islands, islandFilter, setIslandFilter, statusFilter, setStatusFilter, sortBy, setSortBy }: { query: string; setQuery: (value: string) => void; islands: string[]; islandFilter: string; setIslandFilter: (value: string) => void; statusFilter: string; setStatusFilter: (value: string) => void; sortBy: string; setSortBy: (value: string) => void }) {
  return <div className="ledger-toolbar"><div className="table-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by treasure name or island..." /></div><select value={islandFilter} onChange={(event) => setIslandFilter(event.target.value)}><option value="all">All islands</option>{islands.map((island) => <option key={island} value={island}>{island}</option>)}</select><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">All status</option><option value="Found">Found</option><option value="Lost">Lost</option><option value="Stolen">Stolen</option></select><select value={sortBy} onChange={(event) => setSortBy(event.target.value)}><option value="updated">Latest updated</option><option value="value">Highest value</option><option value="name">Name A–Z</option><option value="status">Status</option></select></div>;
}

function LedgerTable({ treasures, allCount, page, pageSize, totalPages, onPageChange, onPageSizeChange, loading, onEdit, onDelete, onHistory, onTrack }: { treasures: Treasure[]; allCount: number; page: number; pageSize: number; totalPages: number; onPageChange: (p: number) => void; onPageSizeChange: (s: number) => void; loading: boolean; onEdit: (treasure: Treasure) => void; onDelete: (treasure: Treasure) => void; onHistory: (treasure: Treasure) => void; onTrack: (treasure: Treasure) => void }) {
  const startRecord = allCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRecord = Math.min(page * pageSize, allCount);
  const rowOffset = (page - 1) * pageSize;

  return <div className="table-shell"><div className="table-scroll"><table><thead><tr><th>#</th><th>Treasure name</th><th>Island</th><th>Value <span>↕</span></th><th>Depth</th><th>Status</th><th>Last updated</th><th>Actions</th></tr></thead><tbody>{loading ? Array.from({ length: 5 }).map((_, index) => <tr className="skeleton-row" key={index}><td colSpan={8}><span /></td></tr>) : treasures.length === 0 ? <tr><td colSpan={8}><div className="empty-state"><Sparkles size={25} /><strong>No treasure on this chart.</strong><span>Try a different filter, or add a new cache for the crew.</span></div></td></tr> : treasures.map((treasure, index) => <tr key={treasure.id} onDoubleClick={() => onTrack(treasure)}><td className="row-number">{String(rowOffset + index + 1).padStart(2, "0")}</td><td><button className="treasure-name" onClick={() => onTrack(treasure)}><span className={`treasure-emblem ${treasure.status.toLowerCase()}`}>{treasure.status === "Found" ? "✦" : treasure.status === "Lost" ? "◈" : "!"}</span><span><strong>{treasure.name}</strong><small>{treasure.terrain}</small></span></button></td><td>{treasure.islandName}</td><td className="value-cell">{money(treasure.value)}</td><td>{treasure.burialDepth} m</td><td><StatusBadge status={treasure.status} /></td><td>{dateLabel(treasure.updatedAt)}</td><td><div className="row-actions"><button className="icon-button mini" title="Track nautical route" aria-label={`Track route for ${treasure.name}`} onClick={() => onTrack(treasure)}><Compass size={14} /></button><button className="icon-button mini" aria-label={`Edit ${treasure.name}`} onClick={() => onEdit(treasure)}><Edit3 size={14} /></button><button className="icon-button mini danger" aria-label={`Delete ${treasure.name}`} onClick={() => onDelete(treasure)}><Trash2 size={14} /></button><button className="icon-button mini more" aria-label={`View ${treasure.name} history`} onClick={() => onHistory(treasure)}><MoreHorizontal size={14} /></button></div></td></tr>)}</tbody></table></div><div className="table-foot"><span>Showing <b>{startRecord}</b>–<b>{endRecord}</b> of <b>{allCount}</b> treasures</span><div className="table-page-size"><span>Show: </span><select value={pageSize} onChange={(e) => onPageSizeChange(Number(e.target.value))}><option value={8}>8 per page</option><option value={15}>15 per page</option><option value={25}>25 per page</option><option value={allCount || 100}>All ({allCount})</option></select></div><div className="pagination"><button disabled={page <= 1} onClick={() => onPageChange(page - 1)} aria-label="Previous page">‹</button>{Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (<button key={p} className={p === page ? "current" : ""} onClick={() => onPageChange(p)}>{p}</button>))}<button disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} aria-label="Next page">›</button></div></div></div>;
}

function QuickActions({ onAdd, onMap, onAnalytics }: { onAdd: () => void; onMap: () => void; onAnalytics: () => void }) { return <section className="quick-actions panel"><SectionTitle title="Quick Actions" sub="Common tasks for faster navigation." icon={Sparkles} /><div className="action-grid"><button onClick={onAdd}><Plus /><span>Add treasure</span></button><button onClick={onMap}><MapIcon /><span>View map</span></button><button onClick={onAnalytics}><BarChart3 /><span>See analytics</span></button><button onClick={() => toast("Island management is ready for your next expedition", { icon: "🏝" })}><Grid2X2 /><span>Manage islands</span></button></div></section>; }
function RecentActivity({ stats, onTrack, onViewAll }: { stats: { recentActivity: Array<{ id: number; name: string; islandName: string; status: Status; updatedAt: Date; createdAt: Date }> }; onTrack: (treasure: Treasure) => void; onViewAll: () => void }) {
  return <section className="activity panel">
    <div className="activity-head">
      <SectionTitle title="Recent Activity" sub="Latest movements in the ledger." icon={Navigation} />
      <button onClick={onViewAll}>View all</button>
    </div>
    <div className="activity-list">
      {stats.recentActivity.slice(0, 5).map((activity) => (
        <div className="activity-item" key={activity.id} style={{ cursor: "pointer" }} onClick={() => onTrack({ id: activity.id, name: activity.name, islandName: activity.islandName, latitude: 0, longitude: 0, value: 0, status: activity.status, updatedAt: activity.updatedAt, createdAt: activity.createdAt } as any)}>
          <i className={activity.status.toLowerCase()} />
          <span>{activity.name} <b>{activity.status === "Found" ? "marked as Found" : activity.status === "Stolen" ? "flagged as Stolen" : "updated"}</b></span>
          <time>{dateLabel(activity.updatedAt)}</time>
        </div>
      ))}
    </div>
  </section>;
}

function ActivityModal({ stats, onClose, onTrack }: { stats: { recentActivity: Array<{ id: number; name: string; islandName: string; status: Status; updatedAt: Date; createdAt: Date }> }; onClose: () => void; onTrack: (treasure: Treasure) => void }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    return stats.recentActivity.filter((act) => {
      const matchesSearch = !search.trim() || `${act.name} ${act.islandName}`.toLowerCase().includes(search.toLowerCase().trim());
      const matchesFilter = filter === "all" || act.status === filter;
      return matchesSearch && matchesFilter;
    });
  }, [stats.recentActivity, search, filter]);

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 9999, position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(2, 10, 16, 0.82)", backdropFilter: "blur(8px)" }}>
      <div className="treasure-modal" onClick={(e) => e.stopPropagation()} style={{ width: "min(780px, 92vw)", maxHeight: "85vh", display: "flex", flexDirection: "column", margin: "auto" }}>
        <div className="modal-head">
          <div>
            <span className="eyebrow">FLEET LOGBOOK & VOYAGES</span>
            <h2>All Fleet Activity</h2>
            <p>Complete historical log of all cache updates, recoveries, and thefts across the archipelago.</p>
          </div>
          <button className="icon-button mini" onClick={onClose} aria-label="Close activity log"><X size={16} /></button>
        </div>

        <div className="ledger-toolbar" style={{ gridTemplateColumns: "1fr 140px", marginBottom: "14px" }}>
          <div className="table-search">
            <Search size={16} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search activity by treasure name or island..." />
          </div>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="Found">Found</option>
            <option value="Lost">Lost</option>
            <option value="Stolen">Stolen</option>
          </select>
        </div>

        <div className="table-scroll" style={{ flex: 1, overflowY: "auto", border: "1px solid rgba(142, 178, 179, 0.15)", borderRadius: "8px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "rgba(3, 16, 23, 0.9)", position: "sticky", top: 0, zIndex: 2 }}>
                <th style={{ paddingLeft: "12px" }}>Status</th>
                <th>Treasure Name</th>
                <th>Island Location</th>
                <th>Logged Date</th>
                <th style={{ textAlign: "right", paddingRight: "12px" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state" style={{ minHeight: "140px" }}>
                      <Sparkles size={22} />
                      <strong>No activity matching your search filter.</strong>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((activity) => (
                  <tr key={`${activity.id}-${activity.updatedAt}`} style={{ cursor: "pointer" }} onClick={() => { onTrack({ id: activity.id, name: activity.name, islandName: activity.islandName, latitude: 0, longitude: 0, value: 0, status: activity.status, updatedAt: activity.updatedAt, createdAt: activity.createdAt } as any); onClose(); }}>
                    <td style={{ paddingLeft: "12px" }}>
                      <StatusBadge status={activity.status} />
                    </td>
                    <td>
                      <strong style={{ color: "#edf1e9", fontSize: "11px" }}>{activity.name}</strong>
                    </td>
                    <td>{activity.islandName}</td>
                    <td>{dateLabel(activity.updatedAt)}</td>
                    <td style={{ textAlign: "right", paddingRight: "12px" }}>
                      <button className="icon-button mini" title="Track on Map" onClick={(e) => { e.stopPropagation(); onTrack({ id: activity.id, name: activity.name, islandName: activity.islandName, latitude: 0, longitude: 0, value: 0, status: activity.status, updatedAt: activity.updatedAt, createdAt: activity.createdAt } as any); onClose(); }}>
                        <Compass size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="modal-foot" style={{ marginTop: "16px", paddingTop: "12px" }}>
          <span>Showing <b>{filtered.length}</b> of <b>{stats.recentActivity.length}</b> recorded fleet events</span>
          <div>
            <button className="button gold" onClick={onClose}>Close Logbook</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AnalyticsView({ treasures, stats }: { treasures: Treasure[]; stats: { total: number; totalValue: number; counts: Record<Status, number>; mostValuableIsland: { name: string; value: number } | null } }) {
  const islandTotals = useMemo(() => Array.from(treasures.reduce((map, treasure) => map.set(treasure.islandName, (map.get(treasure.islandName) ?? 0) + treasure.value), new Map<string, number>()).entries()).sort((a, b) => b[1] - a[1]), [treasures]);

  const recoveredValue = useMemo(() => treasures.filter(t => t.status === "Found").reduce((sum, t) => sum + t.value, 0), [treasures]);
  const lostValue = useMemo(() => treasures.filter(t => t.status === "Lost").reduce((sum, t) => sum + t.value, 0), [treasures]);
  const stolenValue = useMemo(() => treasures.filter(t => t.status === "Stolen").reduce((sum, t) => sum + t.value, 0), [treasures]);
  const recoveryRate = Math.round((stats.counts.Found / Math.max(stats.total, 1)) * 100);
  const avgValue = Math.round(stats.totalValue / Math.max(stats.total, 1));
  const maxDepth = Math.max(...treasures.map(t => t.burialDepth ?? 0), 0);

  const terrainStats = useMemo(() => {
    const counts: Record<string, number> = { Coastal: 0, Jungle: 0, Cave: 0, Reef: 0, Mountain: 0 };
    treasures.forEach(t => {
      const ter = t.terrain ?? "Coastal";
      counts[ter] = (counts[ter] ?? 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [treasures]);

  const monthlyData = [
    { month: "Jan", count: 4, value: 42000 },
    { month: "Feb", count: 7, value: 89000 },
    { month: "Mar", count: 12, value: 165000 },
    { month: "Apr", count: 9, value: 110000 },
    { month: "May", count: 15, value: 240000 },
    { month: "Jun", count: treasures.length, value: stats.totalValue },
  ];
  const maxMonthlyVal = Math.max(...monthlyData.map(m => m.value), 1);

  return (
    <section className="analytics-view">
      <div className="view-intro">
        <SectionTitle eyebrow="VOYAGE INTELLIGENCE & STATISTICS" title="Archipelago Analytics Deck" sub="Comprehensive financial, terrain, and operational analysis of all charted fleet caches." icon={BarChart3} />
      </div>

      {/* Top Stat KPI Cards */}
      <div className="metric-grid" style={{ marginBottom: "16px" }}>
        <MetricCard icon={ShieldCheck} label="Recovery Efficiency Rate" value={`${recoveryRate}%`} note={`${stats.counts.Found} of ${stats.total} caches recovered`} tone="green" />
        <MetricCard icon={Coins} label="Recovered Gold Value" value={money(recoveredValue)} note={`${Math.round((recoveredValue / Math.max(stats.totalValue, 1)) * 100)}% of total ledger gold`} tone="teal" />
        <MetricCard icon={TrendingUp} label="Average Cache Value" value={money(avgValue)} note="Per charted location" tone="amber" />
        <MetricCard icon={Pickaxe} label="Deepest Burial Depth" value={`${maxDepth} meters`} note="Maximum excavation depth" tone="red" />
        <article className="value-card">
          <span>Top Gold Island</span>
          <strong>{stats.mostValuableIsland?.name ?? "Tortuga Haven"}</strong>
          <small>{money(stats.mostValuableIsland?.value ?? 0)} doubloons buried</small>
          <Compass size={35} />
        </article>
      </div>

      <div className="analytics-grid" style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: "14px", marginBottom: "14px" }}>
        {/* Recovery Donut & Financial Breakdown */}
        <div className="chart-card panel">
          <div className="chart-head">
            <div>
              <span className="eyebrow">RECOVERY DISPOSITION</span>
              <h3>Ledger Value Breakdown</h3>
            </div>
            <span className="chart-total">{stats.total} <small>total caches</small></span>
          </div>
          <div className="donut-wrap">
            <div className="donut" style={{ background: `conic-gradient(#4bd68b 0 ${(stats.counts.Found / Math.max(stats.total, 1)) * 100}%, #ff6861 ${(stats.counts.Found / Math.max(stats.total, 1)) * 100}% ${((stats.counts.Found + stats.counts.Lost) / Math.max(stats.total, 1)) * 100}%, #f5bb42 ${((stats.counts.Found + stats.counts.Lost) / Math.max(stats.total, 1)) * 100}% 100%)` }}>
              <div><strong>{money(stats.totalValue)}</strong><span>gold doubloons</span></div>
            </div>
            <div className="chart-legend">
              <span><i className="found" /> Found <b>{stats.counts.Found} ({money(recoveredValue)})</b></span>
              <span><i className="lost" /> Lost <b>{stats.counts.Lost} ({money(lostValue)})</b></span>
              <span><i className="stolen" /> Stolen <b>{stats.counts.Stolen} ({money(stolenValue)})</b></span>
            </div>
          </div>
        </div>

        {/* Terrain Breakdown */}
        <div className="island-rank panel">
          <div className="chart-head">
            <div>
              <span className="eyebrow">GEOGRAPHIC ENVIRONMENT</span>
              <h3>Terrain Distribution</h3>
            </div>
            <Grid2X2 size={20} />
          </div>
          <div className="rank-list" style={{ marginTop: "18px" }}>
            {terrainStats.map(([terrain, count], index) => {
              const pct = Math.round((count / Math.max(treasures.length, 1)) * 100);
              return (
                <div className="rank-row" key={terrain} style={{ gridTemplateColumns: "30px 100px 1fr 45px" }}>
                  <span className="rank-number" style={{ fontSize: "11px" }}>0{index + 1}</span>
                  <span className="rank-name"><strong>{terrain}</strong><small>{count} caches</small></span>
                  <div className="rank-bar"><i style={{ width: `${pct}%`, background: index === 0 ? "linear-gradient(90deg, #4bd68b, #2bb368)" : index === 1 ? "linear-gradient(90deg, #f3c66b, #d79334)" : "linear-gradient(90deg, #60a5fa, #2563eb)" }} /></div>
                  <b style={{ color: "#d5e5e5", fontSize: "11px" }}>{pct}%</b>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="analytics-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
        {/* Island Gold Ranking */}
        <div className="island-rank panel">
          <div className="chart-head">
            <div>
              <span className="eyebrow">ISLAND LEADERBOARD</span>
              <h3>Where Gold is Concentrated</h3>
            </div>
            <Compass size={20} />
          </div>
          <div className="rank-list">
            {islandTotals.slice(0, 5).map(([island, value], index) => (
              <div className="rank-row" key={island}>
                <span className="rank-number">0{index + 1}</span>
                <span className="rank-name">
                  <strong>{island}</strong>
                  <small>{treasures.filter((treasure) => treasure.islandName === island).length} caches charted</small>
                </span>
                <div className="rank-bar"><i style={{ width: `${(value / Math.max(islandTotals[0]?.[1] ?? 1, 1)) * 100}%` }} /></div>
                <b>{money(value)}</b>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Discovery Trend */}
        <div className="chart-card panel">
          <div className="chart-head">
            <div>
              <span className="eyebrow">EXPEDITION TIMELINE</span>
              <h3>2026 Monthly Discovery Growth</h3>
            </div>
            <TrendingUp size={20} />
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", height: "180px", paddingTop: "20px", paddingBottom: "10px", gap: "12px" }}>
            {monthlyData.map((m) => {
              const hPct = Math.round((m.value / maxMonthlyVal) * 100);
              return (
                <div key={m.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", height: "100%", justifyContent: "flex-end" }}>
                  <small style={{ color: "#eac06c", fontSize: "9px" }}>{m.count} caches</small>
                  <div style={{ width: "100%", maxWidth: "32px", height: `${Math.max(hPct, 12)}%`, background: "linear-gradient(180deg, #f3c66b, #996726)", borderRadius: "4px 4px 0 0", transition: "height 0.4s" }} />
                  <span style={{ color: "#819698", fontSize: "10px", fontWeight: "bold" }}>{m.month}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 🏴‍☠️ Pirate Commodity Exchange & Financial Projections Cards */}
      <CommodityExchangeCard totalValue={stats.totalValue} />
      <FleetProjectionsCard />
    </section>
  );
}

function SettingsView({ user, isAuthenticated, onLogout, theme, toggleTheme }: { user: { name?: string | null; email?: string | null } | null; isAuthenticated: boolean; onLogout: () => Promise<void>; theme: "light" | "dark"; toggleTheme?: () => void }) { const [reducedMotion, setReducedMotion] = useState(false); return <section className="settings-view"><div className="view-intro"><SectionTitle eyebrow="CAPTAIN'S QUARTERS" title="Settings" sub="Configure your command deck and account preferences." icon={Settings} /></div><div className="settings-grid"><div className="settings-card panel"><div className="settings-card-head"><div className="avatar large">{(user?.name ?? "C").slice(0, 1).toUpperCase()}</div><div><span className="eyebrow">ACCOUNT</span><h3>{isAuthenticated ? user?.name ?? "Captain Blackbeard" : "Guest navigator"}</h3><p>{isAuthenticated ? user?.email ?? "Authenticated Manus account" : "Sign in to sync your voyage"}</p></div></div>{isAuthenticated ? <button className="button ghost wide" onClick={() => onLogout().then(() => toast.success("Signed out safely"))}><LogOut size={16} /> Sign out</button> : <button className="button gold wide" onClick={() => startLogin()}>Sign in to your account</button>}</div><div className="settings-card panel"><div className="settings-label">{theme === "dark" ? <Moon size={18} /> : <Sun size={18} />}<div><strong>{theme === "dark" ? "Dark chart mode" : "Daylight chart mode"}</strong><span>Persist this preference across your voyages.</span></div><button className={`toggle ${theme === "dark" ? "on" : ""}`} onClick={() => toggleTheme?.()} aria-label="Toggle light and dark mode"><i /></button></div><div className="settings-label"><Sparkles size={18} /><div><strong>Reduced motion</strong><span>Use calmer transitions across the map.</span></div><button className={`toggle ${reducedMotion ? "on" : ""}`} onClick={() => setReducedMotion((value) => !value)}><i /></button></div><div className="settings-label"><Bell size={18} /><div><strong>Activity alerts</strong><span>Notify the crew about status changes.</span></div><span className="toggle on"><i /></span></div></div></div></section>; }
