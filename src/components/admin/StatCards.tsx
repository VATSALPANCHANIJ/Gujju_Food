import React from "react";
import type { DashboardStats } from "@/lib/admin/shared";

export default function StatCards({ stats }: { stats: DashboardStats }) {
  const cards: { label: string; value: number; accent?: boolean }[] = [
    { label: "Today's Bookings", value: stats.today, accent: true },
    { label: "Tomorrow", value: stats.tomorrow },
    { label: "Pending", value: stats.pending },
    { label: "Confirmed", value: stats.confirmed },
    { label: "Cancelled", value: stats.cancelled },
    { label: "No Show", value: stats.noShow },
    { label: "Completed", value: stats.completed },
    { label: "Guests Today", value: stats.totalGuestsToday, accent: true },
    { label: "Upcoming", value: stats.upcoming },
  ];
  return (
    <div className="ov-stats">
      {cards.map((c) => (
        <div className={`ov-stat ${c.accent ? "ov-stat-accent" : ""}`} key={c.label}>
          <div className="ov-stat-label">{c.label}</div>
          <div className="ov-stat-value">{c.value}</div>
        </div>
      ))}
    </div>
  );
}
