import DashboardShell from "@/app/Pages/Dashboard/Shell/DashboardShell";
import { consoleNav } from "@/app/Pages/Dashboard/Shell/navigation";
import { consoleBase } from "@/app/Pages/Dashboard/Console/consolePages";
import { roleLabels } from "@/app/lib/dashboard/permissions";
import { getDashboardUser } from "@/app/lib/dashboard/session";

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const user = await getDashboardUser("admin");
  return (
    <DashboardShell nav={consoleNav("admin", consoleBase["admin"])} roleLabel={roleLabels["admin"]} userName={user.name}>
      {children}
    </DashboardShell>
  );
}
