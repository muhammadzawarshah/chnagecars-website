import type { Metadata } from "next";
import SellVehicleSite from "@/app/Pages/SellVehicleSite/SellVehicleSite";

export const metadata: Metadata = {
  title: "Sell Your Vehicle | CHANGECARS",
  description: "Sell your vehicle with confidence through the CHANGECARS trusted dealer network.",
};

export default function Page() {
  return <SellVehicleSite />;
}
