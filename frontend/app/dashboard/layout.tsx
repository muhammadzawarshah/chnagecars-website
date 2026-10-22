import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { template: "%s | CHANGECARS Dashboard", default: "CHANGECARS Dashboard" },
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return children;
}
