"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  fmtDate, fmtDateTime, fmtTime, todayISO, tomorrowISO, toISODate,
  OWNER_STATUSES, STATUS_LABEL, type AdminBooking, type OwnerStatus,
} from "@/lib/admin/shared";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";
const MEALS = ["breakfast", "lunch", "dinner"] as const;
const PAGE_SIZE = 8;

/* ---- icons ---- */
const P: Record<string, string> = {
  home: "M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10",
  doc: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M9 13h6M9 17h4",
  cal: "M7 2v3M17 2v3M4 8h16M5 4h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z",
  users: "M16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm0 2c-2.7 0-5 1.3-5 3.5V19h7M16 13c2.7 0 5 1.3 5 3.5V19h-7",
  chart: "M4 20V9M10 20V4M16 20v-8M20 20H2",
  chat: "M21 15a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2z",
  sliders: "M4 6h16M4 12h16M4 18h16M8 6a2 2 0 1 0 .01 0M16 12a2 2 0 1 0 .01 0M10 18a2 2 0 1 0 .01 0",
  staff: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8v-1c0-3 3.5-4.5 7-4.5s7 1.5 7 4.5v1",
  clip: "M9 4h6a1 1 0 0 1 1 1v0h1a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h1M9 4a1 1 0 0 0 0 2h6a1 1 0 0 0 0-2M9 12h6M9 16h4",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0",
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14ZM21 21l-4.3-4.3",
  filter: "M3 4h18l-7 8v6l-4 2v-8z",
  plus: "M12 5v14M5 12h14",
  download: "M12 3v12m0 0 4-4m-4 4-4-4M4 21h16",
  eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  kebab: "M12 6h.01M12 12h.01M12 18h.01",
  x: "M6 6l12 12M18 6 6 18",
  chevron: "M6 9l6 6 6-6",
  phone: "M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.24 11 11 0 0 0 3.5.56 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11 11 0 0 0 .56 3.5 1 1 0 0 1-.24 1Z",
  mail: "M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm0 2 8 5 8-5",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-4 0-8 2-8 5v1h16v-1c0-3-4-5-8-5Z",
  clock: "M12 8v4l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z",
  utensils: "M4 3v7a2 2 0 0 0 4 0V3M6 12v9M18 3c-1.7 0-3 2-3 5s0 4 3 4v9",
  gift: "M20 12v9H4v-9M2 7h20v5H2zM12 22V7M8.5 7A2.5 2.5 0 1 1 12 4.5 2.5 2.5 0 1 1 15.5 7",
  note: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z",
  copy: "M9 9h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2ZM5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1",
  trash: "M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M6 7v13a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7M10 11v6M14 11v6",
  wa: "M12 3a9 9 0 0 0-7.7 13.6L3 21l4.6-1.3A9 9 0 1 0 12 3Zm4.9 12.3c-.2.6-1.2 1.1-1.7 1.1-.4 0-1 .1-3.3-.9-2.6-1.1-4.2-3.8-4.3-4-.1-.2-1-1.3-1-2.5s.6-1.7.8-2c.2-.2.4-.3.6-.3h.4c.2 0 .4 0 .5.4l.7 1.6c.1.1.1.3 0 .5l-.3.4-.3.3c-.1.1-.2.3-.1.5.2.3.7 1.1 1.4 1.7.9.8 1.6 1 1.9 1.1.2.1.4.1.5-.1l.6-.7c.2-.2.3-.2.5-.1l1.5.8c.2.1.4.2.4.3.1.2.1.6-.1 1.1Z",
  history: "M3 3v6h6M3.5 9A9 9 0 1 1 3 12M12 7v5l3 2",
  arrow: "M5 12h14m-6-6 6 6-6 6",
};
function Ic({ d, s = 18 }: { d: string; s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>;
}

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: P.home },
  { id: "bookings", label: "Bookings", icon: P.doc },
  { id: "calendar", label: "Calendar", icon: P.cal },
  { id: "customers", label: "Customers", icon: P.users },
  { id: "reports", label: "Reports", icon: P.chart },
  { id: "messages", label: "Messages", icon: P.chat, soon: true },
  { id: "settings", label: "Settings", icon: P.sliders, soon: true },
  { id: "staff", label: "Staff", icon: P.staff, soon: true },
  { id: "audit", label: "Audit Log", icon: P.clip, soon: true },
] as const;
type NavId = (typeof NAV)[number]["id"];

const STATUS_COLORS: Record<string, string> = { confirmed: "#16a34a", pending: "#d97706", completed: "#392f5a", cancelled: "#dc2626", "no-show": "#6b7280" };

function digitsOnly(p: string) { return (p || "").replace(/[^\d]/g, ""); }
function csvOf(rows: AdminBooking[]): string {
  const head = ["Reference", "Name", "Phone", "Email", "Guests", "Date", "Time", "Meal", "Occasion", "Special Request", "Status", "Booked On"];
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [head.map(esc).join(","), ...rows.map((b) => [b.booking_reference, b.name, b.phone, b.email, b.guests, b.booking_date, b.booking_time, b.meal_type, b.occasion || "", b.special_request || "", b.status, b.created_at].map(esc).join(","))].join("\n");
}
function download(name: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: "text/csv" }));
  const a = document.createElement("a"); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
}
function beep() { try { const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext; const c = new C(); const o = c.createOscillator(); const g = c.createGain(); o.connect(g); g.connect(c.destination); o.type = "sine"; o.frequency.value = 660; g.gain.setValueAtTime(0.0001, c.currentTime); g.gain.exponentialRampToValueAtTime(0.15, c.currentTime + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.4); o.start(); o.stop(c.currentTime + 0.42); } catch { /**/ } }

export default function AdminBoard({ initialBookings }: { initialBookings: AdminBooking[] }) {
  const [bookings, setBookings] = useState<AdminBooking[]>(initialBookings);
  const [nav, setNav] = useState<NavId>("dashboard");
  const [sideOpen, setSideOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [range, setRange] = useState<"all" | "today" | "tomorrow" | "week" | "month">("today");
  const [status, setStatus] = useState<"all" | OwnerStatus>("all");
  const [meal, setMeal] = useState<"all" | (typeof MEALS)[number]>("all");
  const [sortKey, setSortKey] = useState<keyof AdminBooking>("created_at");
  const [sortDir, setSortDir] = useState<1 | -1>(-1);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<AdminBooking | null>(null);
  const [walkOpen, setWalkOpen] = useState(false);

  const [unseen, setUnseen] = useState(0);
  useEffect(() => {
    const last = Number(localStorage.getItem("ov_seen_at") || 0);
    setUnseen(initialBookings.filter((b) => new Date(b.created_at).getTime() > last).length);
  }, [initialBookings]);

  const t = todayISO(), tm = tomorrowISO();
  const activeOn = (d: string) => bookings.filter((b) => b.booking_date === d && b.status !== "cancelled").length;
  const yISO = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return toISODate(d); })();
  const total = bookings.length || 1;
  const cnt = (s: string) => bookings.filter((b) => b.status === s).length;
  const trend = (cur: number, prev: number) => (prev === 0 ? (cur > 0 ? 100 : 0) : Math.round(((cur - prev) / prev) * 100));

  const headline = [
    { label: "Today's Bookings", value: activeOn(t), sub: `${trend(activeOn(t), activeOn(yISO)) >= 0 ? "↑" : "↓"} ${Math.abs(trend(activeOn(t), activeOn(yISO)))}% from yesterday`, up: trend(activeOn(t), activeOn(yISO)) >= 0, ic: P.cal, cls: "ic-teal" },
    { label: "Tomorrow's Bookings", value: activeOn(tm), sub: `${trend(activeOn(tm), activeOn(t)) >= 0 ? "↑" : "↓"} ${Math.abs(trend(activeOn(tm), activeOn(t)))}% from today`, up: trend(activeOn(tm), activeOn(t)) >= 0, ic: P.cal, cls: "ic-gold-t" },
    { label: "Confirmed", value: cnt("confirmed"), sub: `${Math.round((cnt("confirmed") / total) * 100)}% of total`, ic: "M20 6 9 17l-5-5", cls: "ic-green-t" },
    { label: "Pending", value: cnt("pending"), sub: "Need attention", ic: P.clock, cls: "ic-gold-t" },
    { label: "Cancelled", value: bookings.filter((b) => b.status === "cancelled" && b.booking_date === t).length, sub: "Today", ic: P.x, cls: "ic-red-t" },
  ];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = bookings.filter((b) => {
      if (status !== "all" && b.status !== status) return false;
      if (meal !== "all" && b.meal_type !== meal) return false;
      if (range === "today" && b.booking_date !== t) return false;
      if (range === "tomorrow" && b.booking_date !== tm) return false;
      if (range === "week") { const d = new Date(b.booking_date + "T00:00:00"); const s = new Date(); s.setDate(s.getDate() - s.getDay()); const e = new Date(s); e.setDate(e.getDate() + 6); if (d < s || d > e) return false; }
      if (range === "month" && b.booking_date.slice(0, 7) !== t.slice(0, 7)) return false;
      if (q && !`${b.booking_reference} ${b.name} ${b.phone} ${b.email}`.toLowerCase().includes(q)) return false;
      return true;
    });
    rows.sort((a, b) => { const av = a[sortKey] ?? "", bv = b[sortKey] ?? ""; return (av < bv ? -1 : av > bv ? 1 : 0) * sortDir; });
    return rows;
  }, [bookings, search, status, meal, range, sortKey, sortDir, t, tm]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  useEffect(() => { setPage(1); }, [search, status, meal, range, nav]);
  const toggleSort = (k: keyof AdminBooking) => { if (sortKey === k) setSortDir((d) => (d === 1 ? -1 : 1)); else { setSortKey(k); setSortDir(1); } };

  const goSearch = (v: string) => { setSearch(v); if (v && nav !== "bookings") setNav("bookings"); };

  const patchStatus = async (b: AdminBooking, s: OwnerStatus) => {
    const res = await fetch(`/api/owner/bookings/${b.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: s }) });
    const d = await res.json().catch(() => ({}));
    if (res.ok && d.success) { setBookings((p) => p.map((x) => (x.id === b.id ? { ...x, status: s } : x))); setSelected((sl) => (sl && sl.id === b.id ? { ...sl, status: s } : sl)); }
    else alert(d.message || "Could not update status.");
  };
  const removeBooking = async (b: AdminBooking) => {
    if (!confirm(`Delete ${b.booking_reference}? This cannot be undone.`)) return;
    const res = await fetch(`/api/owner/bookings/${b.id}`, { method: "DELETE" });
    const d = await res.json().catch(() => ({}));
    if (res.ok && d.success) { setBookings((p) => p.filter((x) => x.id !== b.id)); setSelected(null); } else alert(d.message || "Could not delete.");
  };
  const logout = async () => { try { await fetch("/api/owner/logout", { method: "POST" }); } finally { window.location.replace("/owner/login"); } };

  const isTable = nav === "dashboard" || nav === "bookings";

  return (
    <div className="ov-layout">
      {/* sidebar */}
      <div className={`ov-scrim ${sideOpen ? "is-open" : ""}`} onClick={() => setSideOpen(false)} />
      <aside className={`ov-sidebar ${sideOpen ? "is-open" : ""}`}>
        <div className="ov-logo">
          <div className="ov-logo-mark">GU<b>JJ</b>U</div>
          <div className="ov-logo-sub">FOOD HUB</div>
          <div className="ov-logo-tag">ADMIN PANEL</div>
        </div>
        <nav className="ov-nav">
          {NAV.map((n) => (
            <button key={n.id} className={`ov-navitem ${nav === n.id ? "is-active" : ""}`} onClick={() => { setNav(n.id); setSideOpen(false); }}>
              <Ic d={n.icon} />{n.label}
              {"soon" in n && n.id === "messages" && <span className="ov-navbadge">3</span>}
            </button>
          ))}
          <button className="ov-navitem" onClick={logout}><Ic d={P.logout} />Logout</button>
        </nav>
        <div className="ov-side-card">
          <div className="ov-side-card-img" style={{ backgroundImage: `url(${BASE}/assets/Booking/Image/Restaurants_Image.png)` }} />
          <div className="ov-side-card-body">
            <strong>Gujju Food Hub</strong>
            <span>Hobart, Tasmania</span>
            <a className="ov-side-card-link" href="/" target="_blank" rel="noreferrer">View Website <Ic d="M7 17 17 7M9 7h8v8" s={13} /></a>
          </div>
        </div>
      </aside>

      {/* main */}
      <div className="ov-main">
        <header className="ov-topbar">
          <button className="ov-hamburger" onClick={() => setSideOpen(true)} aria-label="Menu"><Ic d="M4 6h16M4 12h16M4 18h16" /></button>
          <div className="ov-welcome">
            <h1>Welcome back, Owner! 👋</h1>
            <p>Here&apos;s what&apos;s happening with your bookings today.</p>
          </div>
          <div className="ov-topsearch">
            <Ic d={P.search} />
            <input placeholder="Search bookings, customers, phone…" value={search} onChange={(e) => goSearch(e.target.value)} />
          </div>
          <div className="ov-topicon" onClick={() => { localStorage.setItem("ov_seen_at", String(Date.now())); setUnseen(0); }} title="Notifications">
            <Ic d={P.bell} />{unseen > 0 && <span className="ov-bell-badge">{unseen}</span>}
          </div>
          <div className="ov-avatar"><div className="ov-avatar-circle">OH</div><span>Owner</span><Ic d={P.chevron} s={14} /></div>
        </header>

        <div className="ov-content">
          {isTable && (
            <>
              <div className="ov-stats">
                {headline.map((c) => (
                  <div className="ov-stat" key={c.label}>
                    <div className="ov-stat-top">
                      <span className="ov-stat-label">{c.label}</span>
                      <span className={`ov-stat-ic ${c.cls}`}><Ic d={c.ic} s={20} /></span>
                    </div>
                    <div className="ov-stat-value">{c.value}</div>
                    <div className={`ov-stat-trend ${c.up === true ? "up" : c.up === false ? "down" : ""}`}>{c.sub}</div>
                  </div>
                ))}
              </div>

              <div className="ov-toolbar">
                <select className="ov-select" value={range} onChange={(e) => setRange(e.target.value as typeof range)}>
                  <option value="today">Today, {fmtDate(t)}</option>
                  <option value="tomorrow">Tomorrow</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="all">All Dates</option>
                </select>
                <select className="ov-select" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
                  <option value="all">All Status</option>
                  {OWNER_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                </select>
                <div className="ov-search"><Ic d={P.search} /><input placeholder="Search by name, phone or reference…" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
                <select className="ov-select" value={meal} onChange={(e) => setMeal(e.target.value as typeof meal)}>
                  <option value="all">All Meals</option>{MEALS.map((m) => <option key={m} value={m}>{m[0].toUpperCase() + m.slice(1)}</option>)}
                </select>
                <button className="ov-btn-new" onClick={() => setWalkOpen(true)}><Ic d={P.plus} s={16} /> New Booking</button>
              </div>

              <div className="ov-card-panel">
                {filtered.length === 0 ? (
                  <div className="ov-empty"><h3>No bookings found</h3><p>Try clearing filters or search.</p></div>
                ) : (
                  <>
                    <div className="ov-table-wrap">
                      <table className="ov-table">
                        <thead><tr>
                          <th onClick={() => toggleSort("booking_reference")}>Ref #</th>
                          <th onClick={() => toggleSort("name")}>Customer</th>
                          <th>Phone</th><th onClick={() => toggleSort("guests")}>Guests</th>
                          <th onClick={() => toggleSort("booking_time")}>Time</th><th>Meal</th>
                          <th onClick={() => toggleSort("status")}>Status</th><th>Actions</th>
                        </tr></thead>
                        <tbody>
                          {pageRows.map((b) => (
                            <tr key={b.id} className={`ov-row-${b.status}`} onClick={() => setSelected(b)}>
                              <td className="ov-ref">#{b.booking_reference}</td>
                              <td><div className="ov-cust"><b>{b.name}</b><span>{b.email}</span></div></td>
                              <td><span className="ov-cell-ic"><Ic d={P.phone} s={15} />{b.phone}</span></td>
                              <td><span className="ov-cell-ic"><Ic d={P.users} s={15} />{b.guests}</span></td>
                              <td>{fmtTime(b.booking_time)}</td>
                              <td style={{ textTransform: "capitalize" }}>{b.meal_type}</td>
                              <td><span className={`ov-status ov-status-${b.status}`}>{STATUS_LABEL[b.status as OwnerStatus] || b.status}</span></td>
                              <td onClick={(e) => e.stopPropagation()}>
                                <div className="ov-rowact">
                                  <button onClick={() => setSelected(b)} title="View"><Ic d={P.eye} s={16} /></button>
                                  <button title="More"><Ic d={P.kebab} s={16} /></button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="ov-pagination">
                      <span className="ov-page-info">Showing {(page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} bookings</span>
                      <div className="ov-page-btns">
                        <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>‹</button>
                        {Array.from({ length: Math.min(pageCount, 4) }, (_, i) => i + 1).map((n) => (
                          <button key={n} className={page === n ? "is-active" : ""} onClick={() => setPage(n)}>{n}</button>
                        ))}
                        <button disabled={page >= pageCount} onClick={() => setPage((p) => p + 1)}>›</button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {nav === "dashboard" && (
                <div className="ov-widgets">
                  <TimelineWidget bookings={bookings} onSeeAll={() => setNav("bookings")} />
                  <OverviewWidget bookings={bookings} />
                  <QuickActions bookings={bookings} onWalk={() => setWalkOpen(true)} onCal={() => setNav("calendar")} filtered={filtered} />
                </div>
              )}
            </>
          )}

          {nav === "calendar" && <div className="ov-card-panel"><CalendarView bookings={bookings} onPick={(d) => { setNav("bookings"); setRange("all"); setSearch(d); }} /></div>}
          {nav === "reports" && <div className="ov-card-panel"><Reports bookings={bookings} /></div>}
          {nav === "customers" && <div className="ov-card-panel"><Customers bookings={bookings} /></div>}
          {(nav === "messages" || nav === "settings" || nav === "staff" || nav === "audit") && (
            <div className="ov-card-panel"><ComingSoon label={NAV.find((n) => n.id === nav)!.label} /></div>
          )}
        </div>

        <footer className="ov-footer"><span>© 2026 Gujju Food Hub. All rights reserved.</span><span>Version 1.0.0</span></footer>
      </div>

      <BookingDrawer booking={selected} onClose={() => setSelected(null)} onStatus={patchStatus} onDelete={removeBooking} />
      {walkOpen && <WalkInModal onClose={() => setWalkOpen(false)} onCreated={(b) => { setBookings((p) => [b, ...p]); setWalkOpen(false); beep(); }} />}
    </div>
  );
}

/* ---------------- widgets ---------------- */
function TimelineWidget({ bookings, onSeeAll }: { bookings: AdminBooking[]; onSeeAll: () => void }) {
  const rows = bookings.filter((b) => b.booking_date === todayISO() && b.status !== "cancelled").sort((a, b) => (a.booking_time < b.booking_time ? -1 : 1)).slice(0, 5);
  return (
    <div className="ov-widget">
      <h3>Today&apos;s Timeline</h3>
      {rows.length === 0 ? <p style={{ color: "var(--ov-muted)", fontSize: "0.86rem" }}>No bookings today.</p> : (
        <div className="ov-tl">
          {rows.map((b) => (
            <div className="ov-tl-item" key={b.id}>
              <span className="ov-tl-time">{fmtTime(b.booking_time)}</span>
              <span className="ov-tl-name">{b.name}</span>
              <span className="ov-tl-guests">{b.guests} Guests</span>
            </div>
          ))}
        </div>
      )}
      <button className="ov-widget-link" onClick={onSeeAll}>View All Timeline</button>
    </div>
  );
}

function OverviewWidget({ bookings }: { bookings: AdminBooking[] }) {
  const parts = [
    { k: "confirmed", label: "Confirmed", n: bookings.filter((b) => b.status === "confirmed").length },
    { k: "pending", label: "Pending", n: bookings.filter((b) => b.status === "pending").length },
    { k: "cancelled", label: "Cancelled", n: bookings.filter((b) => b.status === "cancelled").length },
    { k: "no-show", label: "No Show", n: bookings.filter((b) => b.status === "no-show").length },
    { k: "completed", label: "Completed", n: bookings.filter((b) => b.status === "completed").length },
  ].filter((p) => p.n > 0);
  const total = bookings.length || 0;
  const sum = parts.reduce((a, b) => a + b.n, 0) || 1;
  let acc = 0; const R = 52, C = 2 * Math.PI * R;
  return (
    <div className="ov-widget">
      <h3>Booking Overview</h3>
      <div className="ov-overview">
        <svg width="130" height="130" viewBox="0 0 130 130">
          <circle cx="65" cy="65" r={R} fill="none" stroke="#eceff1" strokeWidth="16" />
          {parts.map((p) => {
            const frac = p.n / sum; const dash = frac * C; const off = -acc * C; acc += frac;
            return <circle key={p.k} cx="65" cy="65" r={R} fill="none" stroke={STATUS_COLORS[p.k]} strokeWidth="16" strokeDasharray={`${dash} ${C - dash}`} strokeDashoffset={off} transform="rotate(-90 65 65)" />;
          })}
          <text x="65" y="60" textAnchor="middle" fontSize="10" fill="#8b95a1">Total Bookings</text>
          <text x="65" y="80" textAnchor="middle" fontSize="24" fontWeight="800" fill="#1f2937">{total}</text>
        </svg>
        <div className="ov-legend2">
          {[["confirmed", "Confirmed"], ["pending", "Pending"], ["cancelled", "Cancelled"], ["no-show", "No Show"]].map(([k, l]) => {
            const n = bookings.filter((b) => b.status === k).length;
            return <div className="row" key={k}><i style={{ background: STATUS_COLORS[k] }} />{l}<span className="n">{n} ({total ? Math.round((n / total) * 100) : 0}%)</span></div>;
          })}
        </div>
      </div>
    </div>
  );
}

function QuickActions({ bookings, onWalk, onCal, filtered }: { bookings: AdminBooking[]; onWalk: () => void; onCal: () => void; filtered: AdminBooking[] }) {
  const items: [string, string, () => void][] = [
    ["Export Today's Bookings", P.download, () => download(`bookings-today-${todayISO()}.csv`, csvOf(bookings.filter((b) => b.booking_date === todayISO())))],
    ["Export All Bookings", P.download, () => download("bookings-all.csv", csvOf(filtered))],
    ["Calendar View", P.cal, onCal],
    ["Add Walk-in Booking", P.users, onWalk],
  ];
  return (
    <div className="ov-widget">
      <h3>Quick Actions</h3>
      <div className="ov-qa">
        {items.map(([label, ic, fn]) => (
          <button key={label} onClick={fn}>{label}<Ic d={ic} s={17} /></button>
        ))}
      </div>
    </div>
  );
}

/* ---------------- drawer ---------------- */
function BookingDrawer({ booking, onClose, onStatus, onDelete }: { booking: AdminBooking | null; onClose: () => void; onStatus: (b: AdminBooking, s: OwnerStatus) => void; onDelete: (b: AdminBooking) => void }) {
  const b = booking;
  const copy = () => { if (!b) return; navigator.clipboard?.writeText(`Booking #${b.booking_reference}\n${b.name} · ${b.phone} · ${b.email}\n${fmtDate(b.booking_date)} ${fmtTime(b.booking_time)} · ${b.guests} guests · ${b.meal_type}\nOccasion: ${b.occasion || "—"}\nRequest: ${b.special_request || "—"}\nStatus: ${b.status}`); };
  const rows: [string, string, React.ReactNode][] = b ? [
    [P.user, "Customer Name", b.name],
    [P.phone, "Phone", <a key="p" href={`tel:${b.phone}`}>{b.phone}</a>],
    [P.mail, "Email", b.email],
    [P.users, "Guests", `${b.guests} Adults`],
    [P.cal, "Reservation Date", fmtDate(b.booking_date)],
    [P.clock, "Reservation Time", fmtTime(b.booking_time)],
    [P.utensils, "Meal", b.meal_type],
    [P.gift, "Occasion", b.occasion || "—"],
    [P.note, "Special Request", b.special_request || "—"],
    [P.history, "Booked On", fmtDateTime(b.created_at)],
  ] : [];
  return (
    <>
      <div className={`ov-drawer-overlay ${b ? "is-open" : ""}`} onClick={onClose} />
      <aside className={`ov-drawer ${b ? "is-open" : ""}`} aria-hidden={!b}>
        {b && (
          <>
            <div className="ov-drawer-head"><h2>Booking Details</h2><button className="ov-drawer-close" onClick={onClose}><Ic d={P.x} s={16} /></button></div>
            <div className="ov-drawer-body">
              <div className="ov-dref"><b>#{b.booking_reference}</b><span className={`ov-status ov-status-${b.status}`}>{STATUS_LABEL[b.status as OwnerStatus] || b.status}</span></div>
              {rows.map(([ic, k, v], i) => (
                <div className="ov-drow" key={i}><span className="ov-drow-ic"><Ic d={ic} s={17} /></span><span className="ov-drow-k">{k}</span><span className="ov-drow-v" style={{ textTransform: k === "Meal" ? "capitalize" : "none" }}>{v}</span></div>
              ))}
              <div className="ov-drow" style={{ borderBottom: "none", display: "block" }}>
                <span className="ov-drow-k" style={{ display: "flex", alignItems: "center", gap: 12, width: "auto" }}><span className="ov-drow-ic"><Ic d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" s={17} /></span>Status</span>
                <div className="ov-dstatus">
                  <select value={b.status} onChange={(e) => onStatus(b, e.target.value as OwnerStatus)}>
                    {OWNER_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="ov-drawer-actions">
              <a className="ov-actbtn call" href={`tel:${b.phone}`}><Ic d={P.phone} s={18} />Call</a>
              <a className="ov-actbtn wa" href={`https://wa.me/${digitsOnly(b.phone)}`} target="_blank" rel="noreferrer"><Ic d={P.wa} s={18} />WhatsApp</a>
              <button className="ov-actbtn copy" onClick={copy}><Ic d={P.copy} s={18} />Copy</button>
              <button className="ov-actbtn del" onClick={() => onDelete(b)}><Ic d={P.trash} s={18} />Delete</button>
            </div>
            <div className="ov-drawer-foot">
              <button className="ov-btn ov-btn-ghost">View History</button>
              <button className="ov-btn ov-btn-primary" onClick={onClose}>Done</button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}

/* ---------------- walk-in ---------------- */
function WalkInModal({ onClose, onCreated }: { onClose: () => void; onCreated: (b: AdminBooking) => void }) {
  const [f, setF] = useState({ name: "", phone: "", email: "", guests: "2", booking_date: todayISO(), booking_time: "19:00", meal_type: "dinner", occasion: "", special_request: "" });
  const [err, setErr] = useState(""); const [loading, setLoading] = useState(false);
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(""); setLoading(true);
    try {
      const res = await fetch("/api/owner/bookings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...f, guests: Number(f.guests) }) });
      const d = await res.json().catch(() => ({}));
      if (res.ok && d.success) onCreated(d.booking as AdminBooking); else setErr(d.message || "Could not create walk-in.");
    } catch { setErr("Something went wrong."); } finally { setLoading(false); }
  };
  return (
    <div className="ov-modal-overlay" onClick={onClose}>
      <div className="ov-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ov-modal-head"><h2>New Walk-in Booking</h2><button className="ov-drawer-close" onClick={onClose}><Ic d={P.x} s={16} /></button></div>
        <form className="ov-modal-body" onSubmit={submit}>
          <div className="ov-grid2">
            <div className="ov-field"><label>Name</label><input className="ov-input" value={f.name} onChange={(e) => set("name", e.target.value)} required /></div>
            <div className="ov-field"><label>Phone</label><input className="ov-input" value={f.phone} onChange={(e) => set("phone", e.target.value)} required /></div>
            <div className="ov-field"><label>Email (optional)</label><input className="ov-input" value={f.email} onChange={(e) => set("email", e.target.value)} /></div>
            <div className="ov-field"><label>Guests</label><input className="ov-input" type="number" min={1} value={f.guests} onChange={(e) => set("guests", e.target.value)} /></div>
            <div className="ov-field"><label>Date</label><input className="ov-input" type="date" value={f.booking_date} onChange={(e) => set("booking_date", e.target.value)} /></div>
            <div className="ov-field"><label>Time</label><input className="ov-input" type="time" value={f.booking_time} onChange={(e) => set("booking_time", e.target.value)} /></div>
            <div className="ov-field"><label>Meal</label><select className="ov-input" value={f.meal_type} onChange={(e) => set("meal_type", e.target.value)}>{MEALS.map((m) => <option key={m} value={m}>{m}</option>)}</select></div>
            <div className="ov-field"><label>Occasion (optional)</label><input className="ov-input" value={f.occasion} onChange={(e) => set("occasion", e.target.value)} /></div>
          </div>
          <div className="ov-field" style={{ marginTop: 12 }}><label>Special Request (optional)</label><input className="ov-input" value={f.special_request} onChange={(e) => set("special_request", e.target.value)} /></div>
          {err && <p className="ov-error">{err}</p>}
          <button className="ov-btn ov-btn-primary" style={{ marginTop: 14, width: "100%" }} disabled={loading}>{loading ? <><span className="ov-spinner" /> Saving…</> : "Create Booking"}</button>
        </form>
      </div>
    </div>
  );
}

/* ---------------- calendar ---------------- */
function CalendarView({ bookings, onPick }: { bookings: AdminBooking[]; onPick: (d: string) => void }) {
  const [view, setView] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });
  const counts = useMemo(() => { const map = new Map<string, number>(); bookings.forEach((b) => { if (b.status !== "cancelled") map.set(b.booking_date, (map.get(b.booking_date) || 0) + 1); }); return map; }, [bookings]);
  const first = new Date(view.y, view.m, 1).getDay(); const days = new Date(view.y, view.m + 1, 0).getDate();
  const cells: (string | null)[] = []; for (let i = 0; i < first; i++) cells.push(null); for (let d = 1; d <= days; d++) cells.push(toISODate(new Date(view.y, view.m, d)));
  const t = todayISO();
  return (
    <>
      <div className="ov-cal-head">
        <span className="ov-cal-title">{new Date(view.y, view.m, 1).toLocaleDateString("en-AU", { month: "long", year: "numeric" })}</span>
        <div className="ov-page-btns">
          <button onClick={() => setView((v) => { const d = new Date(v.y, v.m - 1, 1); return { y: d.getFullYear(), m: d.getMonth() }; })}>‹</button>
          <button onClick={() => setView((v) => { const d = new Date(v.y, v.m + 1, 1); return { y: d.getFullYear(), m: d.getMonth() }; })}>›</button>
        </div>
      </div>
      <div className="ov-cal-grid">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => <div className="ov-cal-dow" key={d}>{d}</div>)}
        {cells.map((c, i) => c === null ? <div className="ov-cal-cell is-empty" key={`e${i}`} /> : (
          <div key={c} className={`ov-cal-cell ${c === t ? "is-today" : ""}`} onClick={() => counts.get(c) && onPick(c)}>
            <span className="ov-cal-day">{Number(c.split("-")[2])}</span>{counts.get(c) ? <span className="ov-cal-count">{counts.get(c)}</span> : null}
          </div>
        ))}
      </div>
    </>
  );
}

/* ---------------- reports ---------------- */
function Reports({ bookings }: { bookings: AdminBooking[] }) {
  const days: { d: string; n: number; g: number }[] = [];
  for (let i = 6; i >= 0; i--) { const dt = new Date(); dt.setDate(dt.getDate() - i); const iso = toISODate(dt); const rows = bookings.filter((b) => b.booking_date === iso && b.status !== "cancelled"); days.push({ d: iso, n: rows.length, g: rows.reduce((a, b) => a + (Number(b.guests) || 0), 0) }); }
  const maxN = Math.max(1, ...days.map((x) => Math.max(x.n, x.g)));
  return (
    <div className="ov-charts">
      <div className="ov-widget"><h3>Bookings &amp; Guests — Last 7 Days</h3>
        <svg viewBox="0 0 340 170" width="100%" height="180">
          {days.map((x, i) => { const bw = 42, gap = 6, x0 = 10 + i * (bw + gap); const hN = (x.n / maxN) * 130, hG = (x.g / maxN) * 130; return (<g key={x.d}><rect x={x0} y={150 - hN} width={(bw - gap) / 2} height={hN} rx={3} fill="#0f9d8f" /><rect x={x0 + (bw - gap) / 2 + 3} y={150 - hG} width={(bw - gap) / 2} height={hG} rx={3} fill="#f4d06f" /><text x={x0 + bw / 2} y={164} textAnchor="middle" fontSize="9" fill="#8b95a1">{Number(x.d.split("-")[2])}</text></g>); })}
        </svg>
        <div className="ov-legend"><span><i style={{ background: "#0f9d8f" }} />Bookings</span><span><i style={{ background: "#f4d06f" }} />Guests</span></div>
      </div>
      <div className="ov-widget"><h3>Status Distribution</h3><OverviewWidget bookings={bookings} /></div>
    </div>
  );
}

/* ---------------- customers ---------------- */
function Customers({ bookings }: { bookings: AdminBooking[] }) {
  const map = new Map<string, { name: string; phone: string; email: string; visits: number; last: string }>();
  bookings.forEach((b) => { const key = b.phone || b.email; const e = map.get(key); if (e) { e.visits++; if (b.booking_date > e.last) e.last = b.booking_date; } else map.set(key, { name: b.name, phone: b.phone, email: b.email, visits: 1, last: b.booking_date }); });
  const list = [...map.values()].sort((a, b) => b.visits - a.visits);
  return list.length === 0 ? <div className="ov-empty"><h3>No customers yet</h3></div> : (
    <div className="ov-cust-grid">
      {list.map((c, i) => (
        <div className="ov-cust-card" key={i}><b>{c.name}</b><span>{c.phone}</span><span>{c.email}</span><span className="ov-cust-visits">{c.visits} visit{c.visits !== 1 ? "s" : ""} · last {fmtDate(c.last)}</span></div>
      ))}
    </div>
  );
}

function ComingSoon({ label }: { label: string }) {
  return <div className="ov-soon"><div className="ov-soon-ic"><Ic d="M12 8v4l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z" s={28} /></div><h3>{label} — coming soon</h3><p>This module is part of the future-ready roadmap (staff, analytics, messaging).</p></div>;
}
