import { notFound } from "next/navigation"
import { getActivity, getDealers, getDealersById, getInventory, getPlatformOverview, getStaff } from "@/app/lib/dashboard/api"
import { can, roleLabels } from "@/app/lib/dashboard/permissions"
import { Role } from "@/app/lib/dashboard/types"
import PageHeader from "../ui/PageHeader"
import DealerInventory from "../Dealer/DealerInventory"
import ConsoleOverview from "./ConsoleOverview"
import DealersTable from "./DealersTable"
import CompareDealers from "./CompareDealers"
import StaffTable from "./StaffTable"

// Admin and super admin screens. Each one checks the role's permissions, so the same
// code serves both and a missing right hides the feature (or 404s the page).

type ConsoleRole = Exclude<Role, "dealer">

export const consoleBase: Record<ConsoleRole, string> = {
    "super-admin": "/dashboard/super-admin",
    "admin": "/dashboard/admin",
};

export async function OverviewPage({ role }: { role: ConsoleRole }) {
    const [overview, dealers, activity] = await Promise.all([getPlatformOverview(), getDealers(), getActivity()]);
    return <ConsoleOverview title={`${roleLabels[role]} overview`} overview={overview} dealers={dealers} activity={activity} base={consoleBase[role]} canViewAs={can(role, "dealers.viewAs")} canCompare={can(role, "dealers.compare")} />;
}

export async function DealersPage({ role }: { role: ConsoleRole }) {
    if (!can(role, "dealers.view")) notFound();
    const dealers = await getDealers();
    const subtitle = can(role, "dealers.viewAs")
        ? "Approve applications, suspend accounts, tick dealers to compare, or open any dealer's dashboard."
        : "Approve applications and manage dealer accounts.";
    return (
        <>
            <PageHeader title="Dealers" subtitle={subtitle} />
            <DealersTable dealers={dealers} base={consoleBase[role]} canManage={can(role, "dealers.manage")} canCompare={can(role, "dealers.compare")} canViewAs={can(role, "dealers.viewAs")} />
        </>
    );
}

export async function ComparePage({ role, ids }: { role: ConsoleRole, ids: string[] }) {
    if (!can(role, "dealers.compare")) notFound();
    const [selected, dealers] = await Promise.all([getDealersById(ids.slice(0, 4)), getDealers()]);
    return <CompareDealers selected={selected} options={dealers.filter((dealer) => dealer.status !== "pending")} base={consoleBase[role]} />;
}

export async function ListingsPage({ role }: { role: ConsoleRole }) {
    if (!can(role, "listings.moderate")) notFound();
    const [items, dealers] = await Promise.all([getInventory(), getDealers()]);
    const dealerNames = Object.fromEntries(dealers.map((dealer) => [dealer.id, dealer.name]));
    return (
        <>
            <PageHeader title="Listings" subtitle={`${items.length} listings across all dealers · check the flagged tab first`} />
            <DealerInventory items={items} dealerNames={dealerNames} />
        </>
    );
}

export async function StaffPage({ role }: { role: ConsoleRole }) {
    if (!can(role, "staff.manage")) notFound();
    const staff = await getStaff();
    return (
        <>
            <PageHeader title="Admins & staff" subtitle="Who can sign in to the CHANGECARS console." />
            <StaffTable staff={staff} />
        </>
    );
}
