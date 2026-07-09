import React from "react";
import { fetchAllBookings, type AdminBooking } from "@/lib/admin/queries";
import AdminBoard from "@/components/admin/AdminBoard";

// Always fresh, server-rendered (auth is enforced by middleware.ts).
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function OwnerDashboardPage() {
  let bookings: AdminBooking[] = [];
  let error: string | null = null;
  try {
    bookings = await fetchAllBookings();
  } catch (e) {
    error = (e as Error).message;
  }

  if (error) {
    return (
      <div className="ov-shell">
        <div className="ov-panel ov-errorstate">
          <h3>Couldn&apos;t load bookings</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return <AdminBoard initialBookings={bookings} />;
}
