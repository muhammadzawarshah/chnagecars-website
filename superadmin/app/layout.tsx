import type { Metadata } from "next";
import { Inter, Lato, Poppins, Roboto } from "next/font/google";
import "./globals.css";

// Same fonts as the website, so the shared header and footer look identical.
const lato = Lato({ variable: "--font-lato", subsets: ["latin"], weight: ["300", "400", "700", "900"] });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const poppins = Poppins({ variable: "--font-poppins", subsets: ["latin"], weight: ["400", "600", "700"] });
const roboto = Roboto({ variable: "--font-roboto", subsets: ["latin"], weight: ["400", "500", "700"] });
export const metadata: Metadata = { title: { default: "CHANGECARS Superadmin", template: "%s | CHANGECARS Superadmin" }, robots: { index: false, follow: false } };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" className={`${lato.variable} ${inter.variable} ${roboto.variable} ${poppins.variable}`}><body>{children}</body></html>;
}
