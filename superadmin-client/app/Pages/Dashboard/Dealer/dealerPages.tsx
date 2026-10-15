import { notFound } from "next/navigation"
import { getDealer, getInventory, getLeads } from "@/app/lib/dashboard/api"
import PageHeader from "../ui/PageHeader"
import DealerOverview from "./DealerOverview"
import DealerInventory from "./DealerInventory"
import DealerLeads from "./DealerLeads"

// Dealer screens. Used by the dealer's own login (/dashboard/dealer) and by a super admin
// opening that dealer (/dashboard/super-admin/dealers/:id), so both see exactly the same thing.

type DealerPageProps = {
    dealerId: string
    basePath: string
}

export async function DealerHomePage({ dealerId, basePath }: DealerPageProps) {
    const [dealer, inventory, leads] = await Promise.all([getDealer(dealerId), getInventory(dealerId), getLeads(dealerId)]);
    if (!dealer) notFound();
    return <DealerOverview dealer={dealer} inventory={inventory} leads={leads} basePath={basePath} />;
}

export async function DealerInventoryPage({ dealerId }: DealerPageProps) {
    const items = await getInventory(dealerId);
    return (
        <>
            <PageHeader title="Inventory" subtitle={`${items.filter((item) => item.status === "active").length} active of ${items.length} listings`} />
            <DealerInventory items={items} />
        </>
    );
}

export async function DealerLeadsPage({ dealerId }: DealerPageProps) {
    const leads = await getLeads(dealerId);
    return (
        <>
            <PageHeader title="Leads" subtitle={`${leads.filter((lead) => lead.status === "new").length} new leads waiting for a reply`} />
            <DealerLeads leads={leads} />
        </>
    );
}
