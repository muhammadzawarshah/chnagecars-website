import type { Metadata } from "next";
import BeatMyQuote from "@/app/Pages/QuoteForms/BeatMyQuote";

export const metadata: Metadata = {
  title: "Beat My Quote | CHANGECARS",
  description: "CHANGECARS will endeavour to beat any quote received on your brand new vehicle of choice.",
};

export default function Page() {
  return <BeatMyQuote />;
}
