import type { Metadata } from "next";
import Newsletter from "@/app/Pages/Newsletter/Newsletter";

export const metadata: Metadata = {
  title: "Newsletter | CHANGECARS",
  description: "Sign up to the CHANGECARS newsletter for motoring news, reviews and advice in your inbox.",
};

export default function Page() {
  return <Newsletter />;
}
