import type { Metadata } from "next";
import { Inter, Lato } from "next/font/google";
import "./globals.css";
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import FloatingButtons from "./components/FloatingButtons";
import PopupProvider from "./components/Popups/PopupContext";
import Popups from "./components/Popups/Popups";

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "New & Used Cars for Sale | South Africa | CHANGECARS",
  description: "Find new and used cars for sale in South Africa.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${lato.variable} ${inter.variable} antialiased`}>
      <body className="max-[981px]:mt-15">
        <PopupProvider>
          <Header />
          {children}
          <Footer />
          <FloatingButtons />
          <Popups />
        </PopupProvider>
      </body>
    </html>
  );
}
