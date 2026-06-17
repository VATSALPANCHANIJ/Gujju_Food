// /admin/bookings — owner panel. Minimal by design.
import BookingAdminTable from "@/components/Booking/BookingAdminTable";
import "@/components/Booking/booking.css";

export const metadata = { title: "Reservations · Gujju Food Hub" };

export default function AdminBookingsPage() {
  return <BookingAdminTable />;
}
