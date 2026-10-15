import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: { default: "CHANGECARS Superadmin", template: "%s | CHANGECARS Superadmin" }, robots: { index: false, follow: false } };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body style={{ "--font-lato": "Arial, Helvetica, sans-serif", "--font-inter": "Arial, sans-serif", "--font-roboto": "Arial, sans-serif", "--font-poppins": "Arial, sans-serif" } as React.CSSProperties}>{children}</body></html>;
}
