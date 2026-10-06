import { notFound } from "next/navigation";
import { DealerLeadsPage } from "@/app/Pages/Dashboard/Dealer/dealerPages";
import { getDashboardUser } from "@/app/lib/dashboard/session";

export const metadata = { title: "Leads" };

export default async function Page() {
  const user = await getDashboardUser("dealer");
  if (!user.dealerId) notFound();
  return <DealerLeadsPage dealerId={user.dealerId} basePath="/dashboard/dealer" />;
}
