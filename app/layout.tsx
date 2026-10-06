import type { Metadata, Viewport } from "next";
import { Inter, Lato, Poppins, Roboto } from "next/font/google";
import "./globals.css";
import PopupProvider from "./components/Popups/PopupContext";
import LanguageProvider from "./components/Language/LanguageContext";

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "New & Used Cars for Sale | South Africa | CHANGECARS",
  description: "Find new and used cars for sale in South Africa. CHANGECARS is the most trusted buying platform in South Africa. Franchised approved dealers only.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${lato.variable} ${inter.variable} ${roboto.variable} ${poppins.variable}`}>
      <body>
        <LanguageProvider>
          <PopupProvider>
            {children}
          </PopupProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
