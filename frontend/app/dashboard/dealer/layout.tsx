import DashboardShell from "@/app/Pages/Dashboard/Shell/DashboardShell";
import { dealerNav } from "@/app/Pages/Dashboard/Shell/navigation";
import { getDealer } from "@/app/lib/dashboard/api";
import { roleLabels } from "@/app/lib/dashboard/permissions";
import { getDashboardUser } from "@/app/lib/dashboard/session";

export default async function DealerLayout({ children }: LayoutProps<"/dashboard/dealer">) {
  const user = await getDashboardUser("dealer");
  const dealer = user.dealerId ? await getDealer(user.dealerId) : undefined;
  return (
    <DashboardShell nav={dealerNav("/dashboard/dealer")} roleLabel={roleLabels.dealer} userName={user.name} subtitle={dealer?.name}>
      {children}
    </DashboardShell>
  );
}
