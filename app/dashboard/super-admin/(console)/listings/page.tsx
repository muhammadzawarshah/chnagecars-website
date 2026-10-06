import { ListingsPage } from "@/app/Pages/Dashboard/Console/consolePages";

export const metadata = { title: "Listings" };

export default function Page() {
  return <ListingsPage role="super-admin" />;
}
