import { notFound } from "next/navigation";
import { DealerInventoryPage } from "@/app/Pages/Dashboard/Dealer/dealerPages";
import { getDashboardUser } from "@/app/lib/dashboard/session";

export const metadata = { title: "Inventory" };

export default async function Page() {
  const user = await getDashboardUser("dealer");
  if (!user.dealerId) notFound();
  return <DealerInventoryPage dealerId={user.dealerId} basePath="/dashboard/dealer" />;
}
