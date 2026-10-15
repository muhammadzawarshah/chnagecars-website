import type { Metadata } from "next";

// Authenticated dashboards are rendered with the runtime session and API configuration.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { template: "%s | CHANGECARS Dashboard", default: "CHANGECARS Dashboard" },
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return children;
}
