import type { Metadata } from "next";
import KeepItOrChangecars from "@/app/Pages/QuoteForms/KeepItOrChangecars";

export const metadata: Metadata = {
  title: "Keep It or CHANGECARS | CHANGECARS",
  description: "We offer advice to help you make an informed decision as to whether it is time to CHANGECARS.",
};

export default function Page() {
  return <KeepItOrChangecars />;
}
