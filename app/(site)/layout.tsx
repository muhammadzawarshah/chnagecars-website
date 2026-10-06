import Header from "@/app/components/Header/Header";
import Footer from "@/app/components/Footer/Footer";
import FloatingButtons from "@/app/components/FloatingButtons";
import Popups from "@/app/components/Popups/Popups";
import CompareBar from "@/app/components/Compare/CompareBar";

// Public website chrome. Dashboards live outside this group and get their own shell.
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="max-[981px]:mt-14">
      <Header />
      {children}
      <Footer />
      <FloatingButtons />
      <Popups />
      <CompareBar />
    </div>
  );
}
