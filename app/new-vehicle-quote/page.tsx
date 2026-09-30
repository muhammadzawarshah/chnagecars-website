import type { Metadata } from "next";
import NewVehicleQuote from "../Pages/QuoteForms/NewVehicleQuote";

export const metadata: Metadata = {
  title: "Brand New Vehicle Quote | CHANGECARS",
  description: "Let us know what you are looking for and our team will do their best to assist.",
};

export default function Page() {
  return <NewVehicleQuote />;
}
