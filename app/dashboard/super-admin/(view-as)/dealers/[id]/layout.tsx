import Link from "next/link";
import { notFound } from "next/navigation";
import DashboardShell from "@/app/Pages/Dashboard/Shell/DashboardShell";
import { dealerNav } from "@/app/Pages/Dashboard/Shell/navigation";
import Icon from "@/app/Pages/Dashboard/ui/Icon";
import { getDealer } from "@/app/lib/dashboard/api";
import { can, roleLabels } from "@/app/lib/dashboard/permissions";
import { getDashboardUser } from "@/app/lib/dashboard/session";

// A super admin sees the dealer's own dashboard, with a banner making clear whose account it is.
export default async function ViewAsDealerLayout({ children, params }: { children: React.ReactNode, params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getDashboardUser("super-admin");
  if (!can(user.role, "dealers.viewAs")) notFound();
  const dealer = await getDealer(id);
  if (!dealer) notFound();

  const banner = (
    <div className="flex flex-wrap items-center justify-between gap-2 bg-gold px-6 py-2.5 text-sm text-white max-[600px]:px-4">
      <p className="m-0 flex items-center gap-2"><Icon name="eye" size={16} /><span>You are viewing <strong>{dealer.name}</strong>&rsquo;s dashboard as {roleLabels[user.role]}</span></p>
      <Link href="/dashboard/super-admin/dealers" className="flex items-center gap-1.5 rounded-md bg-white/15 px-3 py-1 font-bold text-white no-underline hover:bg-white/25"><Icon name="back" size={14} />Back to Super Admin</Link>
    </div>
  );

  return (
    <DashboardShell nav={dealerNav(`/dashboard/super-admin/dealers/${id}`)} roleLabel={roleLabels[user.role]} userName={user.name} subtitle={`Viewing ${dealer.name}`} banner={banner}>
      {children}
    </DashboardShell>
  );
}
