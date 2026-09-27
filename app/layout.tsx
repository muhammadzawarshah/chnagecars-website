import type { Metadata, Viewport } from "next";
<<<<<<< HEAD
import { Inter, Lato, Roboto } from "next/font/google";
=======
import { Inter, Lato } from "next/font/google";
>>>>>>> origin/main
import "./globals.css";
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import FloatingButtons from "./components/FloatingButtons";
import PopupProvider from "./components/Popups/PopupContext";
import Popups from "./components/Popups/Popups";
import ViewportScript from "./components/ViewportScript";
<<<<<<< HEAD
import LanguageProvider from "./components/Language/LanguageContext";
=======
>>>>>>> origin/main

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

<<<<<<< HEAD
const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400"],
});

=======
>>>>>>> origin/main
export const metadata: Metadata = {
  title: "New & Used Cars for Sale | South Africa | CHANGECARS",
  description: "Find new and used cars for sale in South Africa. CHANGECARS is the most trusted buying platform in South Africa. Franchised approved dealers only.",
};

<<<<<<< HEAD
export const viewport: Viewport = {
  width: 465,
  initialScale: 1,
  minimumScale: 1,
  userScalable: false,
=======
// Fallback only; ViewportScript overrides this on phones narrower than 465px.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
>>>>>>> origin/main
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
<<<<<<< HEAD
    <html lang="en" className={`${lato.variable} ${inter.variable} ${roboto.variable}`}>
      <body className="max-[981px]:mt-14">
        <ViewportScript />
        <LanguageProvider>
          <PopupProvider>
            <Header />
            {children}
            <Footer />
            <FloatingButtons />
            <Popups />
          </PopupProvider>
        </LanguageProvider>
=======
    <html lang="en" className={`${lato.variable} ${inter.variable}`}>
      <head>
        <ViewportScript />
      </head>
      <body className="max-[981px]:mt-15">
        <PopupProvider>
          <Header />
          {children}
          <Footer />
          <FloatingButtons />
          <Popups />
        </PopupProvider>
>>>>>>> origin/main
      </body>
    </html>
  );
}
