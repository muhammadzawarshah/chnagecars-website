import DashboardShell from "@/app/Pages/Dashboard/Shell/DashboardShell";
import { consoleNav } from "@/app/Pages/Dashboard/Shell/navigation";
import { consoleBase } from "@/app/Pages/Dashboard/Console/consolePages";
import { roleLabels } from "@/app/lib/dashboard/permissions";
import { getDashboardUser } from "@/app/lib/dashboard/session";

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const user = await getDashboardUser("super-admin");
  return (
    <DashboardShell nav={consoleNav("super-admin", consoleBase["super-admin"])} roleLabel={roleLabels["super-admin"]} userName={user.name}>
      {children}
    </DashboardShell>
  );
}
