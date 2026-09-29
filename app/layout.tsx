import type { Metadata, Viewport } from "next";
import { Inter, Lato, Roboto } from "next/font/google";
import "./globals.css";
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import FloatingButtons from "./components/FloatingButtons";
import PopupProvider from "./components/Popups/PopupContext";
import Popups from "./components/Popups/Popups";
import LanguageProvider from "./components/Language/LanguageContext";
import CompareBar from "./components/Compare/CompareBar";

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
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
    <html lang="en" className={`${lato.variable} ${inter.variable} ${roboto.variable}`}>
      <body className="max-[981px]:mt-14">
        <LanguageProvider>
          <PopupProvider>
            <Header />
            {children}
            <Footer />
            <FloatingButtons />
            <Popups />
            <CompareBar />
          </PopupProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
