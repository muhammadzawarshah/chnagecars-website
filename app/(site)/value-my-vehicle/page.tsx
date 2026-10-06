import type { Metadata } from "next";
import ValueMyVehicle from "@/app/Pages/QuoteForms/ValueMyVehicle";

export const metadata: Metadata = {
  title: "Value My Vehicle | CHANGECARS",
  description: "Not sure if you want to sell? Let us give you an indicative value of your vehicle.",
};

export default function Page() {
  return <ValueMyVehicle />;
}
