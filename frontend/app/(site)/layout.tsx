import Header from "@/app/components/Header/Header";
import Footer from "@/app/components/Footer/Footer";
import FloatingButtons from "@/app/components/FloatingButtons";
import Popups from "@/app/components/Popups/Popups";
import CompareBar from "@/app/components/Compare/CompareBar";
import { AdsProvider } from "@/app/components/AdsContext";
import { getHomeAds } from "@/app/lib/content/api";

// Public website chrome. Dashboards live outside this group and get their own shell.
export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const ads = await getHomeAds();
  return (
    <AdsProvider ads={ads}>
    <div className="max-[981px]:mt-14">
      <Header />
      {children}
      <Footer />
      <FloatingButtons />
      <Popups />
      <CompareBar />
    </div>
    </AdsProvider>
  );
}
