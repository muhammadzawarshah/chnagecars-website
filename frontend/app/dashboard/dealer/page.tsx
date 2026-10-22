import { notFound } from "next/navigation";
import { DealerHomePage } from "@/app/Pages/Dashboard/Dealer/dealerPages";
import { getDashboardUser } from "@/app/lib/dashboard/session";

export const metadata = { title: "Overview" };

export default async function Page() {
  const user = await getDashboardUser("dealer");
  if (!user.dealerId) notFound();
  return <DealerHomePage dealerId={user.dealerId} basePath="/dashboard/dealer" />;
}
