import type { Metadata } from "next";
import "@/components/admin/admin.css";

// Never let search engines find the owner panel.
export const metadata: Metadata = {
  title: "Owner · Gujju Food Hub",
  robots: { index: false, follow: false, nocache: true },
};

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  return <div className="ov-root">{children}</div>;
}
